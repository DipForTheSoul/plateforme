"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPractitioner, getCurrentProfile } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { submissionReceivedEmail } from "@/lib/email-templates";
import { uniqueSlug } from "@/lib/utils";
import type { Recurrence } from "@/types/database";

export interface ActionState {
  error?: string;
  success?: string;
}

const eventSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(20).max(8000),
  category_ids: z.array(z.string().uuid()).min(1).max(5),
  venue_id: z.string().uuid().nullable(),
  start_date: z.string().min(10),
  end_date: z.string().optional().nullable(),
  duration_minutes: z.coerce.number().int().positive().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  languages: z.array(z.string()).min(1),
  recurrence: z.enum(["weekly", "biweekly", "monthly"]).optional().nullable(),
  recurrence_count: z.coerce.number().int().min(2).max(26).optional().nullable(),
  included: z.string().max(2000).optional().nullable(),
  to_bring: z.string().max(2000).optional().nullable(),
  video_url: z.string().url().optional().nullable(),
  images: z.array(z.string().url()).max(6),
});

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category_ids: formData.getAll("category_ids").map(String).filter(Boolean),
    venue_id: String(formData.get("venue_id") ?? "") || null,
    start_date: formData.get("start_date"),
    end_date: String(formData.get("end_date") ?? "") || null,
    duration_minutes: String(formData.get("duration_minutes") ?? "") || null,
    price: String(formData.get("price") ?? "") || null,
    languages: formData.getAll("languages").map(String).filter(Boolean),
    recurrence: String(formData.get("recurrence") ?? "") || null,
    recurrence_count: String(formData.get("recurrence_count") ?? "") || null,
    included: String(formData.get("included") ?? "").trim() || null,
    to_bring: String(formData.get("to_bring") ?? "").trim() || null,
    video_url: String(formData.get("video_url") ?? "").trim() || null,
    images: formData.getAll("images").map(String).filter(Boolean),
  });
}

/**
 * Synchronise les univers d'un événement dans la table de liaison
 * `event_categories` (multi-univers §2.1) : on repart d'une table propre
 * (remplacement complet), et `events.category_id` garde le 1er comme principal.
 */
async function syncEventCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  categoryIds: string[]
) {
  await supabase.from("event_categories").delete().eq("event_id", eventId);
  if (categoryIds.length) {
    await supabase
      .from("event_categories")
      .insert(categoryIds.map((category_id) => ({ event_id: eventId, category_id })));
  }
}

/** Décale une date ISO selon la récurrence choisie. */
function shiftDate(iso: string, recurrence: Recurrence, step: number): string {
  const d = new Date(iso);
  if (recurrence === "weekly") d.setDate(d.getDate() + 7 * step);
  if (recurrence === "biweekly") d.setDate(d.getDate() + 14 * step);
  if (recurrence === "monthly") d.setMonth(d.getMonth() + step);
  return d.toISOString();
}

/**
 * Dépôt d'un événement (Phase 2) :
 *   1. consomme 1 crédit (atomique, blocage à 0 — fonction SQL consume_credit) ;
 *   2. crée l'événement parent en `pending` ;
 *   3. génère les occurrences récurrentes comme lignes filles ;
 *   4. e-mail de confirmation de dépôt.
 */
export async function createEvent(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) return { error: "Aucune fiche praticien trouvée." };
  if (practitioner.status !== "approved") {
    return { error: "Votre fiche doit être validée par Didier avant de publier." };
  }

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: "Formulaire incomplet — vérifiez les champs obligatoires." };
  }
  const input = parsed.data;

  const supabase = await createClient();

  // 1. Crédit (lève une exception SQL si solde à 0).
  const { error: creditError } = await supabase.rpc("consume_credit", {
    p_note: `Dépôt : ${input.title}`,
  });
  if (creditError) {
    return {
      error: creditError.message.includes("épuisé")
        ? "Solde de publications épuisé — rachetez un pack pour publier."
        : "Impossible de consommer un crédit. Réessayez.",
    };
  }

  // 2. Événement parent.
  const base = {
    description: input.description,
    category_id: input.category_ids[0], // catégorie principale (dégradé/1er badge)
    practitioner_id: practitioner.id,
    venue_id: input.venue_id,
    duration_minutes: input.duration_minutes,
    price: input.price,
    languages: input.languages,
    included: input.included,
    to_bring: input.to_bring,
    video_url: input.video_url,
    images: input.images,
    status: "pending" as const,
  };

  const { data: parent, error } = await supabase
    .from("events")
    .insert({
      ...base,
      title: input.title,
      slug: uniqueSlug(input.title),
      start_date: new Date(input.start_date).toISOString(),
      end_date: input.end_date ? new Date(input.end_date).toISOString() : null,
      recurrence: input.recurrence,
      recurrence_count: input.recurrence ? input.recurrence_count ?? 4 : null,
    })
    .select("id, title, slug, start_date, end_date")
    .single();

  if (error || !parent) {
    return { error: "Enregistrement impossible. Réessayez." };
  }

  // 2b. Univers du parent (multi-univers §2.1).
  await syncEventCategories(supabase, parent.id, input.category_ids);

  // 3. Occurrences récurrentes (générées à la création — BUILD-BRIEF.md Phase 2).
  if (input.recurrence) {
    const count = input.recurrence_count ?? 4;
    const occurrences = Array.from({ length: count - 1 }, (_, i) => ({
      ...base,
      title: input.title,
      slug: uniqueSlug(input.title),
      start_date: shiftDate(parent.start_date, input.recurrence!, i + 1),
      end_date: parent.end_date
        ? shiftDate(parent.end_date, input.recurrence!, i + 1)
        : null,
      parent_event_id: parent.id,
    }));
    if (occurrences.length) {
      const { data: children } = await supabase
        .from("events")
        .insert(occurrences)
        .select("id");
      // Chaque occurrence est une ligne à part → ses propres univers.
      for (const child of children ?? []) {
        await syncEventCategories(supabase, child.id, input.category_ids);
      }
    }
  }

  // 4. Confirmation de dépôt.
  const email = practitioner.contact?.email;
  if (email) {
    const tpl = submissionReceivedEmail(practitioner.name, input.title);
    await sendEmail({ to: email, ...tpl });
  }

  revalidatePath("/espace-praticien/evenements");
  redirect("/espace-praticien/evenements?depose=1");
}

/** Modification d'un événement par son praticien (repasse en `pending`). */
export async function updateEvent(
  eventId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) return { error: "Aucune fiche praticien trouvée." };

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: "Formulaire incomplet — vérifiez les champs obligatoires." };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      title: input.title,
      description: input.description,
      category_id: input.category_ids[0], // catégorie principale
      venue_id: input.venue_id,
      start_date: new Date(input.start_date).toISOString(),
      end_date: input.end_date ? new Date(input.end_date).toISOString() : null,
      duration_minutes: input.duration_minutes,
      price: input.price,
      languages: input.languages,
      included: input.included,
      to_bring: input.to_bring,
      video_url: input.video_url,
      images: input.images,
      // Toute modification repart en relecture (le trigger SQL empêche de
      // toute façon un praticien de changer lui-même le statut vers approved).
    })
    .eq("id", eventId)
    .eq("practitioner_id", practitioner.id);

  if (error) return { error: "Mise à jour impossible." };

  // Univers (multi-univers §2.1).
  await syncEventCategories(supabase, eventId, input.category_ids);

  revalidatePath("/espace-praticien/evenements");
  redirect("/espace-praticien/evenements?modifie=1");
}

/**
 * Création d'un événement par l'ADMIN (§8) — même formulaire que les praticiens,
 * mais l'admin choisit le/la praticien·ne propriétaire, aucun crédit consommé,
 * et l'événement est publié directement (statut `approved`).
 */
export async function adminCreateEvent(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Réservé à l'administrateur." };
  }

  const ownerId = String(formData.get("owner_practitioner_id") ?? "");
  if (!ownerId) return { error: "Choisissez le/la praticien·ne propriétaire." };

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: "Formulaire incomplet — vérifiez les champs obligatoires." };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const base = {
    description: input.description,
    category_id: input.category_ids[0],
    practitioner_id: ownerId,
    venue_id: input.venue_id,
    duration_minutes: input.duration_minutes,
    price: input.price,
    languages: input.languages,
    included: input.included,
    to_bring: input.to_bring,
    video_url: input.video_url,
    images: input.images,
    status: "approved" as const, // créé par l'admin → directement en ligne
  };

  const { data: parent, error } = await supabase
    .from("events")
    .insert({
      ...base,
      title: input.title,
      slug: uniqueSlug(input.title),
      start_date: new Date(input.start_date).toISOString(),
      end_date: input.end_date ? new Date(input.end_date).toISOString() : null,
      recurrence: input.recurrence,
      recurrence_count: input.recurrence ? input.recurrence_count ?? 4 : null,
    })
    .select("id, start_date, end_date")
    .single();

  if (error || !parent) return { error: "Enregistrement impossible." };

  await syncEventCategories(supabase, parent.id, input.category_ids);

  if (input.recurrence) {
    const count = input.recurrence_count ?? 4;
    const occurrences = Array.from({ length: count - 1 }, (_, i) => ({
      ...base,
      title: input.title,
      slug: uniqueSlug(input.title),
      start_date: shiftDate(parent.start_date, input.recurrence!, i + 1),
      end_date: parent.end_date
        ? shiftDate(parent.end_date, input.recurrence!, i + 1)
        : null,
      parent_event_id: parent.id,
    }));
    if (occurrences.length) {
      const { data: children } = await supabase
        .from("events")
        .insert(occurrences)
        .select("id");
      for (const child of children ?? []) {
        await syncEventCategories(supabase, child.id, input.category_ids);
      }
    }
  }

  revalidatePath("/admin/soumissions");
  redirect("/admin/soumissions?cree=1");
}

/**
 * Édition d'un événement par l'ADMIN (§3/§8) — non limitée au propriétaire.
 * Didier peut modifier n'importe quelle expérience ; le statut n'est pas touché.
 */
export async function adminUpdateEvent(
  eventId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Réservé à l'administrateur." };
  }

  const parsed = parseEventForm(formData);
  if (!parsed.success) {
    return { error: "Formulaire incomplet — vérifiez les champs obligatoires." };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("events")
    .update({
      title: input.title,
      description: input.description,
      category_id: input.category_ids[0],
      venue_id: input.venue_id,
      start_date: new Date(input.start_date).toISOString(),
      end_date: input.end_date ? new Date(input.end_date).toISOString() : null,
      duration_minutes: input.duration_minutes,
      price: input.price,
      languages: input.languages,
      included: input.included,
      to_bring: input.to_bring,
      video_url: input.video_url,
      images: input.images,
    })
    .eq("id", eventId);

  if (error) return { error: "Mise à jour impossible." };

  await syncEventCategories(supabase, eventId, input.category_ids);

  revalidatePath("/admin/soumissions");
  revalidatePath(`/experiences/${input.title}`);
  return { success: "Expérience mise à jour." };
}

/** Suppression d'un événement par son praticien (occurrences en cascade). */
export async function deleteEvent(formData: FormData): Promise<void> {
  const eventId = String(formData.get("event_id") ?? "");
  const practitioner = await getCurrentPractitioner();
  if (!practitioner || !eventId) return;

  const supabase = await createClient();
  await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("practitioner_id", practitioner.id);

  revalidatePath("/espace-praticien/evenements");
}
