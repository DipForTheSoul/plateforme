"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPractitioner, getCurrentProfile } from "@/lib/auth";
import type { ActionState } from "@/app/actions/events";

const profileSchema = z.object({
  name: z.string().min(2).max(120),
  bio: z.string().max(4000).optional().nullable(),
  specialties: z.array(z.string().max(60)).max(10),
  languages: z.array(z.string()).max(6),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  website: z.string().url().optional().nullable(),
  instagram: z.string().url().optional().nullable(),
  facebook: z.string().url().optional().nullable(),
  googleUrl: z.string().url().optional().nullable(),
  googleRating: z.string().max(4).optional().nullable(),
  googleCount: z.string().max(7).optional().nullable(),
  review_url: z.string().url().optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  photos: z.array(z.string().url()).max(6),
});

/** Mise à jour de la fiche praticien (le statut/crédits restent verrouillés par trigger SQL). */
export async function updatePractitionerProfile(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const practitioner = await getCurrentPractitioner();
  if (!practitioner) return { error: "Aucune fiche praticien trouvée." };

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim() || null,
    specialties: String(formData.get("specialties") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    languages: formData.getAll("languages").map(String).filter(Boolean),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    instagram: String(formData.get("instagram") ?? "").trim() || null,
    facebook: String(formData.get("facebook") ?? "").trim() || null,
    googleUrl: String(formData.get("googleUrl") ?? "").trim() || null,
    googleRating: String(formData.get("googleRating") ?? "").trim() || null,
    googleCount: String(formData.get("googleCount") ?? "").trim() || null,
    review_url: String(formData.get("review_url") ?? "").trim() || null,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    photos: formData.getAll("photos").map(String).filter(Boolean),
  });
  if (!parsed.success) {
    return { error: "Vérifiez les champs (les liens doivent être des URL complètes)." };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase
    .from("practitioners")
    .update({
      name: input.name,
      bio: input.bio,
      specialties: input.specialties,
      languages: input.languages,
      contact: {
        ...(input.email ? { email: input.email } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.website ? { website: input.website } : {}),
      },
      links: {
        ...(input.instagram ? { instagram: input.instagram } : {}),
        ...(input.facebook ? { facebook: input.facebook } : {}),
        ...(input.googleUrl ? { googleUrl: input.googleUrl } : {}),
        ...(input.googleRating ? { googleRating: input.googleRating } : {}),
        ...(input.googleCount ? { googleCount: input.googleCount } : {}),
      },
      review_url: input.review_url,
      logo_url: input.logo_url,
      photos: input.photos,
    })
    .eq("id", practitioner.id);

  if (error) return { error: "Mise à jour impossible." };

  revalidatePath("/espace-praticien/profil");
  revalidatePath(`/praticiens/${practitioner.slug}`);
  return { success: "Profil mis à jour." };
}

/**
 * Édition d'une fiche praticien par l'ADMIN (§3) — Didier modifie n'importe
 * quelle fiche. Réservé au rôle admin ; ne touche ni au statut ni aux crédits.
 */
export async function adminUpdatePractitioner(
  practitionerId: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Réservé à l'administrateur." };
  }

  const parsed = profileSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    bio: String(formData.get("bio") ?? "").trim() || null,
    specialties: String(formData.get("specialties") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    languages: formData.getAll("languages").map(String).filter(Boolean),
    email: String(formData.get("email") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    website: String(formData.get("website") ?? "").trim() || null,
    instagram: String(formData.get("instagram") ?? "").trim() || null,
    facebook: String(formData.get("facebook") ?? "").trim() || null,
    googleUrl: String(formData.get("googleUrl") ?? "").trim() || null,
    googleRating: String(formData.get("googleRating") ?? "").trim() || null,
    googleCount: String(formData.get("googleCount") ?? "").trim() || null,
    review_url: String(formData.get("review_url") ?? "").trim() || null,
    logo_url: String(formData.get("logo_url") ?? "").trim() || null,
    photos: formData.getAll("photos").map(String).filter(Boolean),
  });
  if (!parsed.success) {
    return { error: "Vérifiez les champs (les liens doivent être des URL complètes)." };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data: current } = await supabase
    .from("practitioners")
    .select("slug")
    .eq("id", practitionerId)
    .maybeSingle();

  const { error } = await supabase
    .from("practitioners")
    .update({
      name: input.name,
      bio: input.bio,
      specialties: input.specialties,
      languages: input.languages,
      contact: {
        ...(input.email ? { email: input.email } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.website ? { website: input.website } : {}),
      },
      links: {
        ...(input.instagram ? { instagram: input.instagram } : {}),
        ...(input.facebook ? { facebook: input.facebook } : {}),
        ...(input.googleUrl ? { googleUrl: input.googleUrl } : {}),
        ...(input.googleRating ? { googleRating: input.googleRating } : {}),
        ...(input.googleCount ? { googleCount: input.googleCount } : {}),
      },
      review_url: input.review_url,
      logo_url: input.logo_url,
      photos: input.photos,
    })
    .eq("id", practitionerId);

  if (error) return { error: "Mise à jour impossible." };

  revalidatePath("/admin/praticiens");
  if ((current as { slug: string } | null)?.slug) {
    revalidatePath(`/praticiens/${(current as { slug: string }).slug}`);
  }
  return { success: "Fiche mise à jour." };
}
