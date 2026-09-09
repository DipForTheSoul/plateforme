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
  if (!/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(eventId) || !["approved", "rejected"].includes(decision)) return;

  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, slug, practitioner:practitioners(name, contact, user_id)")
    .eq("id", eventId)
    .single();
  if (!event) return;

  const {data: changed, error: updateError} = await supabase
    .from("events")
    .update({ status: decision, admin_message: message })
    .or(`id.eq.${eventId},parent_event_id.eq.${eventId}`).select('id');
  // A single SQL UPDATE commits the decision for the whole series together.
  if(updateError || !changed?.length)throw new Error('La décision n’a pas pu être enregistrée. Aucune notification envoyée.');

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
  revalidatePath("/lieux");
  revalidatePath("/admin/lieux");
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
    const days = await featuredDefaultDays(supabase);
    featured_until = new Date(Date.now() + days * 86400_000).toISOString();
  }

  const {data: changed, error} = await supabase
    .from("events")
    .update({ is_top: !isTop, featured_until })
    .eq("id", eventId).select('id');
  if (error || !changed?.length) throw new Error('La mise en avant n’a pas pu être enregistrée.');
  revalidatePath("/admin/soumissions");
  revalidatePath("/admin/mises-en-avant");
}

/** Durée par défaut (jours) d'une mise en avant, depuis les paramètres. */
async function featuredDefaultDays(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "featured_default_days")
    .maybeSingle();
  if (error) throw new Error('La durée de mise en avant est momentanément indisponible.');
  const days = Number((data as { value: string } | null)?.value);
  return Number.isInteger(days) && days > 0 && days <= 36500 ? days : 30;
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

  const {data: changed, error} = await supabase
    .from("events")
    .update({ is_top: true, featured_until })
    .eq("id", eventId).select('id');
  if (error || !changed?.length) throw new Error('La prolongation n’a pas pu être enregistrée.');
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

  const {error: updateError} = await supabase
    .from("practitioners")
    .update({ status: decision, admin_message: message })
    .eq("id", practitionerId);
  if(updateError)throw new Error('La décision n’a pas pu être enregistrée. Aucune notification envoyée.');

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
 * Passe par adjust_credits_transaction (autorisation et opération idempotente).
 */
export async function grantCreditsManually(formData: FormData) {
  return changeCredits(formData, 1);
}

export async function adjustCreditsManually(formData: FormData) {
  return changeCredits(formData, -1);
}

async function changeCredits(formData: FormData, direction: 1 | -1): Promise<import('./events').ActionState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== 'admin') return {error: 'Réservé à l’administrateur.'};
  const practitionerId = String(formData.get('practitioner_id') ?? '');
  const requestId = String(formData.get('request_id') ?? '');
  const amount = Number(formData.get('amount'));
  const uuid = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;
  if (!uuid.test(practitionerId) || !uuid.test(requestId) || !Number.isInteger(amount) || amount <= 0 || amount > 10000) return {error: 'Choisissez un praticien et un nombre entier de crédits valide.'};
  const supabase = await createClient();
  const {error} = await supabase.rpc('adjust_credits_transaction', {
    p_practitioner_id: practitionerId, p_delta: direction * amount,
    p_request_id: requestId, p_note: String(formData.get('note') ?? '').trim() || (direction > 0 ? 'Paiement manuel' : 'Correction manuelle')
  });
  if (error) return {error: error.message.includes('Solde insuffisant') ? 'Le solde est insuffisant. Aucun crédit retiré.' : 'Modification non confirmée. Réessayez sans changer les champs : la même opération ne sera pas comptée deux fois.'};
  revalidatePath('/', 'layout');
  return {success: direction > 0 ? 'Crédits ajoutés.' : 'Crédits retirés.'};
}
