"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  eventApprovedEmail,
  eventRejectedEmail,
  practitionerApprovedEmail,
} from "@/lib/email-templates";

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
    .select("id, title, slug, practitioner:practitioners(name, contact)")
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
  } | null;
  const to = practitioner?.contact?.email;
  if (to) {
    const tpl =
      decision === "approved"
        ? eventApprovedEmail(practitioner!.name, event.title, event.slug, message)
        : eventRejectedEmail(practitioner!.name, event.title, message);
    await sendEmail({ to, ...tpl });
  }

  revalidatePath("/admin/soumissions");
  revalidatePath("/experiences");
}

/** Mise en avant (top listing) en 1 clic. */
export async function toggleTopListing(formData: FormData): Promise<void> {
  await assertAdmin();
  const eventId = String(formData.get("event_id") ?? "");
  const isTop = formData.get("is_top") === "true";
  if (!eventId) return;

  const supabase = await createClient();
  await supabase.from("events").update({ is_top: !isTop }).eq("id", eventId);
  revalidatePath("/admin/soumissions");
}

/** Validation / refus d'une fiche praticien. */
export async function moderatePractitioner(formData: FormData): Promise<void> {
  await assertAdmin();
  const practitionerId = String(formData.get("practitioner_id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!practitionerId || !["approved", "rejected"].includes(decision)) return;

  const supabase = await createClient();
  const { data: practitioner } = await supabase
    .from("practitioners")
    .select("name, slug, contact")
    .eq("id", practitionerId)
    .single();

  await supabase
    .from("practitioners")
    .update({ status: decision })
    .eq("id", practitionerId);

  const to = (practitioner?.contact as { email?: string } | null)?.email;
  if (to && decision === "approved" && practitioner) {
    const tpl = practitionerApprovedEmail(practitioner.name, practitioner.slug);
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
  await supabase.rpc("grant_credits", {
    p_practitioner_id: practitionerId,
    p_amount: amount,
    p_note: note,
  });

  revalidatePath("/admin/credits");
}
