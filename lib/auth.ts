import { createClient } from "@/lib/supabase/server";
import type { Practitioner, Profile } from "@/types/database";
import { redirect } from "next/navigation";

/** Utilisateur courant + profil (null si non connecté). */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError && (!authError.status || authError.status>=500))throw new Error('La connexion est momentanément indisponible. Réessayez.');
  if(!user)return null;
  const {data,error}=await supabase.from('profiles').select('*').eq('id',user.id).single();
  if(error || !data)throw new Error('Votre profil est momentanément indisponible. Réessayez.');
  return data as Profile;
}

/** Fiche praticien liée à l'utilisateur connecté (null si absente). */
export async function getCurrentPractitioner(): Promise<Practitioner | null> {
    const supabase = await createClient();
    const {
      data: { user },error:authError,
    } = await supabase.auth.getUser();
    if(authError && (!authError.status || authError.status>=500))throw new Error("La connexion est momentanément indisponible. Réessayez.");
    if (!user) return null;

    const { data, error: profileError } = await supabase
      .from("practitioners")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if(profileError) throw new Error('La fiche praticien est momentanément indisponible.');
    if (!data) return null;
    const {data: balance,error} = await supabase.rpc('get_credit_balance',{p_practitioner_id:data.id});
    if(error) throw new Error('Le solde de crédits est momentanément indisponible.');
    return {...data,credits:balance} as Practitioner;
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
