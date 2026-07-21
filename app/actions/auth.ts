"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { slugify } from "@/lib/utils";

export interface AuthState {
  error?: string;
  success?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

/** Connexion e-mail / mot de passe. */
export async function signIn(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "invalidCredentials" };

  // Redirection selon le rôle (admin → /admin, praticien → espace praticien).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .single();

  // Redirection par rôle en priorité (évite qu'un admin arrivant depuis une page
  // praticien via ?next=… ne soit renvoyé dans le mauvais espace).
  if (profile?.role === "admin") {
    redirect(next.startsWith("/admin") ? next : "/admin");
  }
  if (profile?.role === "practitioner") {
    redirect(next.startsWith("/espace-praticien") ? next : "/espace-praticien");
  }
  if (next.startsWith("/")) redirect(next);
  redirect("/");
}

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["participant", "practitioner"]),
  name: z.string().max(120).optional(),
  website: z.string().max(0), // honeypot anti-spam
});

/** Inscription — le rôle admin n'est JAMAIS attribuable ici (voir 0004_functions.sql). */
export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    role: formData.get("role") ?? "participant",
    name: String(formData.get("name") ?? "").trim() || undefined,
    website: String(formData.get("website") ?? ""),
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
  if (isRateLimited(`signup:${ip}`)) return { error: "generic" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback`,
      data: { role: parsed.data.role, preferred_lang: "fr" },
    },
  });
  if (error) {
    return {
      error: error.message.toLowerCase().includes("already")
        ? "emailInUse"
        : "generic",
    };
  }

  // Praticien : on crée immédiatement la fiche (statut pending — validée par Didier).
  if (parsed.data.role === "practitioner" && data.user) {
    const name = parsed.data.name || parsed.data.email.split("@")[0];
    await supabase.from("practitioners").insert({
      user_id: data.user.id,
      name,
      slug: `${slugify(name)}-${data.user.id.slice(0, 6)}`,
      contact: { email: parsed.data.email },
      status: "pending",
    });
  }

  return { success: "checkEmail" };
}

/** Envoi du lien de réinitialisation de mot de passe. */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "generic" };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(`reset:${ip}`)) return { success: "resetSent" };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reinitialiser-mot-de-passe`,
  });
  // Toujours succès : ne révèle pas l'existence d'un compte.
  return { success: "resetSent" };
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
  redirect("/connexion");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
