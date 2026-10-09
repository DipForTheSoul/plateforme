import type { SupabaseClient } from "@supabase/supabase-js";
import type { Practitioner } from "@/types/database";

type PrivateContact = Practitioner["contact"];

export async function getPrivateContactEmail(
  supabase: SupabaseClient,
  practitionerId: string,
): Promise<string | undefined> {
  const { data, error } = await supabase
    .from("practitioner_private_contacts")
    .select("contact")
    .eq("practitioner_id", practitionerId)
    .maybeSingle();
  if (error) throw new Error("Les coordonnées privées sont momentanément indisponibles.");
  const email = (data?.contact as PrivateContact | null)?.email?.trim();
  return email || undefined;
}

export async function withPrivateContact<T extends Practitioner>(
  supabase: SupabaseClient,
  practitioner: T,
): Promise<T> {
  const { data, error } = await supabase
    .from("practitioner_private_contacts")
    .select("contact")
    .eq("practitioner_id", practitioner.id)
    .maybeSingle();
  if (error) throw new Error("Les coordonnées privées sont momentanément indisponibles.");
  return {
    ...practitioner,
    contact: {
      ...practitioner.contact,
      ...((data?.contact as PrivateContact | null) ?? {}),
    },
  };
}

export async function withPrivateContacts<T extends Practitioner>(
  supabase: SupabaseClient,
  practitioners: T[],
): Promise<T[]> {
  if (!practitioners.length) return practitioners;
  const { data, error } = await supabase
    .from("practitioner_private_contacts")
    .select("practitioner_id, contact")
    .in("practitioner_id", practitioners.map((p) => p.id));
  if (error) throw new Error("Les coordonnées privées sont momentanément indisponibles.");
  const contacts = new Map(
    (data ?? []).map((row) => [row.practitioner_id, row.contact as PrivateContact]),
  );
  return practitioners.map((practitioner) => ({
    ...practitioner,
    contact: {
      ...practitioner.contact,
      ...(contacts.get(practitioner.id) ?? {}),
    },
  }));
}
