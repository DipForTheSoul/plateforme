"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPractitioner } from "@/lib/auth";
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
  category_id: z.string().uuid(),
  venue_id: z.string().uuid().nullable(),
  start_date: z.string().min(10),
  end_date: z.string().optional().nullable(),
  duration_minutes: z.coerce.number().int().positive().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  languages: z.array(z.string()).min(1),
  recurrence: z.enum(["weekly", "biweekly", "monthly"]).optional().nullable(),
  recurrence_count: z.coerce.number().int().min(2).max(26).optional().nullable(),
  images: z.array(z.string().url()).max(6),
});

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    category_id: formData.get("category_id"),
    venue_id: String(formData.get("venue_id") ?? "") || null,
    start_date: formData.get("start_date"),
    end_date: String(formData.get("end_date") ?? "") || null,
    duration_minutes: String(formData.get("duration_minutes") ?? "") || null,
    price: String(formData.get("price") ?? "") || null,
    languages: formData.getAll("languages").map(String).filter(Boolean),
    recurrence: String(formData.get("recurrence") ?? "") || null,
    recurrence_count: String(formData.get("recurrence_count") ?? "") || null,
    images: formData.getAll("images").map(String).filter(Boolean),
  });
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
    category_id: input.category_id,
    practitioner_id: practitioner.id,
    venue_id: input.venue_id,
    duration_minutes: input.duration_minutes,
    price: input.price,
    languages: input.languages,
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

  // 3. Occurrences récurrentes (générées à la création — CLAUDE.md Phase 2).
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
      await supabase.from("events").insert(occurrences);
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
      category_id: input.category_id,
      venue_id: input.venue_id,
      start_date: new Date(input.start_date).toISOString(),
      end_date: input.end_date ? new Date(input.end_date).toISOString() : null,
      duration_minutes: input.duration_minutes,
      price: input.price,
      languages: input.languages,
      images: input.images,
      // Toute modification repart en relecture (le trigger SQL empêche de
      // toute façon un praticien de changer lui-même le statut vers approved).
    })
    .eq("id", eventId)
    .eq("practitioner_id", practitioner.id);

  if (error) return { error: "Mise à jour impossible." };

  revalidatePath("/espace-praticien/evenements");
  redirect("/espace-praticien/evenements?modifie=1");
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
