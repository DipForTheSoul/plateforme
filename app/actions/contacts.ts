"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { ActionState } from "@/app/actions/events";
import {parseContactCsv} from '@/lib/contact-csv';
import {z} from 'zod';

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

  if(raw.length>500000)return {error:'Import trop volumineux : divisez le fichier en lots de 500 Ko maximum.'};
  let rows:string[][];
  try{ rows=parseContactCsv(raw).filter(cells=>z.email().safeParse(cells[0]).success); }
  catch{return {error:'Le CSV est incomplet : vérifiez les guillemets.'};}

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

  const { data: inserted, error } = await supabase
    .from("contacts")
    .upsert(contacts, { onConflict: "email", ignoreDuplicates: true }).select('id');
  if (error) return { error: "Import impossible : " + error.message };

  revalidatePath("/admin/newsletter");
  return { success: `${inserted?.length ?? 0} nouveau(x) contact(s) importé(s). Les doublons ont été ignorés.` };
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
  const {error}=await supabase.from("contacts").update({ interests }).eq("id", id);
  if(error)throw new Error('La modification du contact n’a pas été confirmée.');
  revalidatePath("/admin/newsletter");
}

export async function deleteContact(formData: FormData): Promise<void> {
  await assertAdmin();
  const id = String(formData.get("contact_id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const {error}=await supabase.from("contacts").delete().eq("id", id);
  if(error)throw new Error('La suppression du contact n’a pas été confirmée.');
  revalidatePath("/admin/newsletter");
}

/**
 * Synchronise tous les contacts consentants vers MailerLite (§7.1 — import
 * des contacts existants). No-op si la clé API n'est pas configurée.
 * Renvoie un message indiquant le nombre de contacts synchronisés.
 */
export async function syncContactsToMailerLite(afterId?: string): Promise<ActionState & {nextCursor?:string;processed?:number}> {
  await assertAdmin();
  if(afterId && !z.uuid().safeParse(afterId).success)return {error:'Curseur de synchronisation invalide.'};

  const { mailerliteEnabled, upsertSubscriber } = await import("@/lib/mailerlite");
  if (!mailerliteEnabled()) {
    return { error: "MailerLite non configuré — ajoutez MAILERLITE_API_KEY." };
  }

  const supabase = await createClient();
  let query = supabase
    .from("contacts")
    .select("id, email, interests")
    .eq("consent", true)
    .order('id').limit(6);
  if(afterId)query=query.gt('id',afterId);
  const {data,error}=await query;
  if(error)return {error:'Impossible de lire les contacts. Aucune synchronisation confirmée.'};
  const contacts = ((data as { id:string;email: string; interests: string[] }[]) ?? []).slice(0,5);

  let ok = 0;
  const results=await Promise.all(contacts.map(c=>upsertSubscriber({ email: c.email, interests: c.interests })));
  ok=results.filter(Boolean).length;
  if(ok!==contacts.length)return {error:`Synchronisation interrompue : ${ok}/${contacts.length} contacts du dernier lot confirmés. Réessayez après vérification du service ; aucun contact local n’a été supprimé.`,processed:ok};
  revalidatePath("/admin/newsletter");
  return { success: `${ok} contacts synchronisés vers MailerLite.`,processed:ok,nextCursor:(data?.length??0)>5?contacts.at(-1)?.id:undefined };
}
