"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { ActionState } from "@/app/actions/events";

async function assertAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    throw new Error("Réservé à l'administrateur.");
  }
}

/**
 * Import de contacts (Phase 7 — reprise de la base Wix).
 * Format attendu (CSV collé, une ligne par contact, séparateur , ou ;) :
 *   email[,prénom][,nom][,tag1|tag2|…]
 * Les doublons d'e-mail sont ignorés (upsert sur l'e-mail).
 */
export async function importContacts(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await assertAdmin();
  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) return { error: "Collez au moins une ligne." };

  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.split(/[;,]/).map((cell) => cell.trim()))
    .filter((cells) => cells[0]?.includes("@"));

  if (!rows.length) return { error: "Aucune ligne valide (e-mail requis en 1re colonne)." };

  const supabase = await createClient();
  const contacts = rows.map((cells) => ({
    email: cells[0].toLowerCase(),
    first_name: cells[1] || null,
    last_name: cells[2] || null,
    interests: (cells[3] ?? "")
      .split("|")
      .map((t) => t.trim())
      .filter(Boolean),
    consent: true, // base opt-in existante (import Wix)
    opt_in_at: new Date().toISOString(),
    source: "import-wix",
  }));

  const { error } = await supabase
    .from("contacts")
    .upsert(contacts, { onConflict: "email", ignoreDuplicates: true });
  if (error) return { error: "Import impossible : " + error.message };

  revalidatePath("/admin/newsletter");
  return { success: `${contacts.length} contact(s) importé(s).` };
}

/** Mise à jour des tags d'intérêt d'un contact. */
export async function updateContactInterests(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("contact_id") ?? "");
  const interests = String(formData.get("interests") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("contacts").update({ interests }).eq("id", id);
  revalidatePath("/admin/newsletter");
}

export async function deleteContact(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("contact_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("contacts").delete().eq("id", id);
  revalidatePath("/admin/newsletter");
}
