import { createClient } from "@/lib/supabase/server";
import type { Practitioner, Profile } from "@/types/database";
import { redirect } from "next/navigation";

/** Utilisateur courant + profil (null si non connecté). */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    return (data as Profile) ?? null;
  } catch {
    // Supabase non configuré (placeholders) : on se comporte comme déconnecté.
    return null;
  }
}

/** Fiche praticien liée à l'utilisateur connecté (null si absente). */
export async function getCurrentPractitioner(): Promise<Practitioner | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from("practitioners")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    return (data as Practitioner) ?? null;
  } catch {
    return null;
  }
}

/** Garde de layout : exige un rôle, sinon redirige. */
export async function requireRole(
  roles: Array<Profile["role"]>
): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");
  if (!roles.includes(profile.role)) redirect("/");
  return profile;
}
