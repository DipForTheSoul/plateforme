"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  eventApprovedEmail,
  eventRejectedEmail,
  practitionerApprovedEmail,
  practitionerRejectedEmail,
} from "@/lib/email-templates";
import type { Locale } from "@/types/database";

/** Récupère la langue préférée d'un praticien via son profil. */
async function getPractitionerLang(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string | null | undefined
): Promise<Locale> {
  if (!userId) return "fr";
  const { data } = await supabase
    .from("profiles")
    .select("preferred_lang")
    .eq("id", userId)
    .maybeSingle();
  return (data?.preferred_lang as Locale) ?? "fr";
}

/** Vérification systématique du rôle admin (en plus de la RLS). */
async function assertAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Réservé à l'administrateur.");
  }
}

/**
 * Validation / refus d'un événement en 1 clic (Phase 2), avec message
 * optionnel + e-mail automatique au praticien (Phase 7).
 * La décision s'applique aussi à toutes les occurrences filles.
 */
export async function moderateEvent(formData: FormData): Promise<void> {
  await assertAdmin();
  const eventId = String(formData.get("event_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const message = String(formData.get("message") ?? "").trim() || null;
  if (!eventId || !["approved", "rejected"].includes(decision)) return;

  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, practitioner:practitioners(name, contact, user_id)")
    .eq("id", eventId)
    .single();
  if (!event) return;

  await supabase
    .from("events")
    .update({ status: decision, admin_message: message })
    .eq("id", eventId);
  // Occurrences récurrentes : même décision.
  await supabase
    .from("events")
    .update({ status: decision, admin_message: message })
    .eq("parent_event_id", eventId);

  // E-mail automatique validé / refusé (avec message admin).
  const practitioner = event.practitioner as unknown as {
    name: string;
    contact: { email?: string };
    user_id: string | null;
  } | null;
  const to = practitioner?.contact?.email;
  if (to) {
    const lang = await getPractitionerLang(supabase, practitioner?.user_id);
    const tpl =
      decision === "approved"
        ? eventApprovedEmail(practitioner!.name, event.title, event.slug, message, lang)
        : eventRejectedEmail(practitioner!.name, event.title, message, lang);
    await sendEmail({ to, ...tpl });
  }

  revalidatePath("/admin/soumissions");
  revalidatePath("/experiences");
}

/**
 * Mise en avant (top listing) en 1 clic (§6.1).
 * À l'activation : pose une date de fin (`featured_until`) = maintenant +
 * durée par défaut (réglable dans `settings.featured_default_days`).
 * Au retrait : efface la date. L'expiration est appliquée à la lecture.
 */
export async function toggleTopListing(formData: FormData): Promise<void> {
  await assertAdmin();
  const eventId = String(formData.get("event_id") ?? "");
  const isTop = formData.get("is_top") === "true";
  if (!eventId) return;

  const supabase = await createClient();

  let featured_until: string | null = null;
  if (!isTop) {
    const { data: setting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "featured_default_days")
      .maybeSingle();
    const days = Number((setting as { value: string } | null)?.value) || 30;
    featured_until = new Date(Date.now() + days * 86400_000).toISOString();
  }

  await supabase
    .from("events")
    .update({ is_top: !isTop, featured_until })
    .eq("id", eventId);
  revalidatePath("/admin/soumissions");
  revalidatePath("/admin/mises-en-avant");
}

/** Durée par défaut (jours) d'une mise en avant, depuis les paramètres. */
async function featuredDefaultDays(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "featured_default_days")
    .maybeSingle();
  return Number((data as { value: string } | null)?.value) || 30;
}

/**
 * Prolonge une mise en avant (§6.1) : repousse `featured_until` à
 * maintenant + durée par défaut, sans changer `is_top`.
 */
export async function extendFeatured(formData: FormData): Promise<void> {
  await assertAdmin();
  const eventId = String(formData.get("event_id") ?? "");
  if (!eventId) return;

  const supabase = await createClient();
  const days = await featuredDefaultDays(supabase);
  const featured_until = new Date(Date.now() + days * 86400_000).toISOString();

  await supabase
    .from("events")
    .update({ is_top: true, featured_until })
    .eq("id", eventId);
  revalidatePath("/admin/mises-en-avant");
  revalidatePath("/admin/soumissions");
}

/** Validation / refus d'une fiche praticien. */
export async function moderatePractitioner(formData: FormData): Promise<void> {
  await assertAdmin();
  const practitionerId = String(formData.get("practitioner_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const message = String(formData.get("message") ?? "").trim() || null;
  if (!practitionerId || !["approved", "rejected"].includes(decision)) return;

  const supabase = await createClient();
  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("name, slug, contact, user_id")
    .eq("id", practitionerId)
    .single();

  await supabase
    .from("practitioners")
    .update({ status: decision, admin_message: message })
    .eq("id", practitionerId);

  const to = (practitioner?.contact as { email?: string } | null)?.email;
  if (to && practitioner) {
    const lang = await getPractitionerLang(supabase, practitioner.user_id);
    const tpl =
      decision === "approved"
        ? practitionerApprovedEmail(practitioner.name, practitioner.slug, lang)
        : practitionerRejectedEmail(practitioner.name, message, lang);
    await sendEmail({ to, ...tpl });
  }

  revalidatePath("/admin/praticiens");
  revalidatePath("/praticiens");
}

/**
 * Attribution manuelle de crédits (paiement statique QR/IBAN — Phase 6).
 * Passe par la fonction SQL grant_credits (vérifie elle aussi is_admin()).
 */
export async function grantCreditsManually(formData: FormData): Promise<void> {
  await assertAdmin();
  const practitionerId = String(formData.get("practitioner_id") ?? "");
  const amount = Number.parseInt(String(formData.get("amount") ?? "0"), 10);
  const note = String(formData.get("note") ?? "").trim() || "Paiement statique (QR/IBAN)";
  if (!practitionerId || !Number.isInteger(amount) || amount <= 0) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("grant_credits", {
    p_practitioner_id: practitionerId,
    p_amount: amount,
    p_note: note,
  });
  if (error) return;

  // §6.2 — on matérialise un pack avec sa date d'échéance (durée réglable en admin),
  // pour que le praticien voie ses publications restantes + la date de validité.
  const { data: setting } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "pack_default_valid_days")
    .maybeSingle();
  const days = Number((setting as { value: string } | null)?.value) || 365;
  await supabase.from("credit_packs").insert({
    practitioner_id: practitionerId,
    credits_total: amount,
    credits_remaining: amount,
    expires_at: new Date(Date.now() + days * 86400_000).toISOString(),
    source: "manual",
  });

  revalidatePath("/admin/credits");
  revalidatePath("/espace-praticien/credits");
}
