"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentPractitioner } from "@/lib/auth";
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
      },
      photos: input.photos,
    })
    .eq("id", practitioner.id);

  if (error) return { error: "Mise à jour impossible." };

  revalidatePath("/espace-praticien/profil");
  revalidatePath(`/praticiens/${practitioner.slug}`);
  return { success: "Profil mis à jour." };
}
