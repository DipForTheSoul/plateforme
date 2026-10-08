"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isRateLimited } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";
import { safeRedirectPath } from '@/lib/safe-redirect';

export interface AuthState {
  error?: string;
  success?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function localizedPath(formData: FormData, path: string) {
  const locale = String(formData.get('locale'));
  return ['de', 'en'].includes(locale) ? `/${locale}${path}` : path;
}

/** Connexion e-mail / mot de passe. */
export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("next"));
  const bareNext = next.replace(/^\/(fr|de|en)(?=\/|$)/, '');

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "invalidCredentials" };

  // Redirection selon le rôle (admin → /admin, praticien → espace praticien).
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) return { error: 'generic' };
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();
  if (profileError || !profile) return { error: 'generic' };

  // Redirection par rôle en priorité (évite qu'un admin arrivant depuis une page
  // praticien via ?next=… ne soit renvoyé dans le mauvais espace).
  if (profile?.role === "admin") {
    redirect(/^\/admin(?:\/|\?|$)/.test(bareNext) ? next : localizedPath(formData, "/admin"));
  }
  if (profile?.role === "practitioner") {
    redirect(/^\/espace-praticien(?:\/|\?|$)/.test(bareNext) ? next : localizedPath(formData, "/espace-praticien"));
  }
  // Pas de compte visiteur en V2 : un éventuel rôle participant retombe sur l'accueil.
  if (next.startsWith("/")) redirect(next);
  redirect("/");
}

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["participant", "practitioner"]),
  firstName: z.string().min(2).max(80),
  lastName: z.string().min(2).max(80),
  artistName: z.string().min(2).max(120),
  bio: z.string().min(40).max(1000),
  specialties: z.array(z.string().min(1).max(60)).min(1).max(10),
  website: z.string().url().optional(),
  instagram: z.string().url().optional(),
  fax: z.string().max(0), // honeypot anti-spam
});

/** Inscription — le rôle admin n'est JAMAIS attribuable ici (voir 0004_functions.sql). */
export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    role: formData.get("role") ?? "practitioner",
    firstName: String(formData.get("firstName") ?? "").trim(),
    lastName: String(formData.get("lastName") ?? "").trim(),
    artistName: String(formData.get("artistName") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim(),
    specialties: formData.getAll("specialties").map(String).map(value => value.trim()).filter(Boolean),
    website: String(formData.get("website") ?? "").trim() || undefined,
    instagram: String(formData.get("instagram") ?? "").trim() || undefined,
    fax: String(formData.get("fax") ?? ""),
  });
  if (!parsed.success) {
    const passwordIssue = parsed.error.issues.some((i) =>
      i.path.includes("password")
    );
    return { error: passwordIssue ? "weakPassword" : "generic" };
  }
  if (String(formData.get("passwordConfirm") ?? "") !== parsed.data.password) {
    return { error: "passwordMismatch" };
  }

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (await isRateLimited(`signup:${ip}`)) return { error: "generic" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${SITE_URL}/api/auth/callback`,
      data: {
        role: parsed.data.role,
        name: parsed.data.artistName,
        first_name: parsed.data.firstName,
        last_name: parsed.data.lastName,
        bio: parsed.data.bio,
        specialties: parsed.data.specialties,
        website: parsed.data.website,
        instagram: parsed.data.instagram,
        preferred_lang: ['de','en'].includes(String(formData.get('locale'))) ? String(formData.get('locale')) : 'fr',
      },
    },
  });
  if (error) {
    console.error("[signUp] Supabase auth error:", error.message, error.status);
    if (error.message.toLowerCase().includes("already")) return { error: "emailInUse" };
    if (error.message.toLowerCase().includes("rate") || error.status === 429)
      return { error: "rateLimited" };
    return { error: "generic" };
  }

  // Auth trigger creates the pending practitioner in the same database transaction.
  return { success: "checkEmail" };
}

/** Valide et limite une demande avant l'envoi navigateur du lien Supabase. */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!z.email().safeParse(email).success) return { error: "generic" };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (await isRateLimited(`reset:${ip}`)) return { success: "resetSent" };

  // L'envoi Supabase est volontairement effectué dans le navigateur : le
  // vérificateur PKCE doit être conservé sur la même origine que celle qui
  // recevra le callback (domaine live, www éventuel ou URL de prévisualisation).
  return { success: "resetAllowed" };
}

/** Définition du nouveau mot de passe (après clic sur le lien). */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "weakPassword" };
  if (String(formData.get("passwordConfirm") ?? "") !== password) {
    return { error: "passwordMismatch" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "generic" };
  redirect(localizedPath(formData, "/connexion"));
}

/** Crée la fiche praticien manquante pour l'utilisateur connecté. */
export async function createMissingPractitioner(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "practitioner") redirect("/");

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("practitioners")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) redirect("/espace-praticien");

  const metadata = user.user_metadata as Record<string, unknown>;
  const name = String(metadata?.name || user.email?.split("@")[0] || "Praticien");
  const {error:insertError}=await admin.from("practitioners").upsert({
    user_id: user.id,
    name,
    slug: `${slugify(name)}-${user.id.slice(0, 6)}`,
    bio: typeof metadata.bio === "string" ? metadata.bio : null,
    specialties: Array.isArray(metadata.specialties) ? metadata.specialties.filter((item): item is string => typeof item === "string") : [],
    contact: {
      email: user.email,
      ...(typeof metadata.first_name === "string" ? { first_name: metadata.first_name } : {}),
      ...(typeof metadata.last_name === "string" ? { last_name: metadata.last_name } : {}),
      ...(typeof metadata.website === "string" ? { website: metadata.website } : {}),
    },
    links: typeof metadata.instagram === "string" ? { instagram: metadata.instagram } : {},
    status: "pending",
  },{onConflict:"user_id",ignoreDuplicates:true});
  if(insertError)throw new Error("La création de votre fiche a échoué. Réessayez.");
  redirect("/espace-praticien");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
