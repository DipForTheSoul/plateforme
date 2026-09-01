"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import { getCurrentProfile } from "@/lib/auth";
import type { ActionState } from "@/app/actions/events";

const venueSchema = z.object({
  name: z.string().min(2).max(140),
  address: z.string().min(5).max(300),
  country: z.string().length(2).default("CH"),
  city: z.string().max(120).optional().nullable(),
  canton: z.string().max(2).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  rooms: z.coerce.number().int().positive().optional().nullable(),
  website: z.string().max(300).optional().nullable(),
});

/**
 * Création d'un lieu — GÉOCODÉ IMMÉDIATEMENT via Nominatim (règle d'or n°3 :
 * sans lat/lng, la recherche par rayon ne fonctionne pas).
 */
export async function createVenue(
  _prev: ActionState & { venueId?: string },
  formData: FormData
): Promise<ActionState & { venueId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connexion requise." };

  const parsed = venueSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    country: String(formData.get("country") ?? "CH").toUpperCase(),
    city: String(formData.get("city") ?? "").trim() || null,
    canton: String(formData.get("canton") ?? "").toUpperCase() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    capacity: String(formData.get("capacity") ?? "") || null,
    rooms: String(formData.get("rooms") ?? "") || null,
    website: String(formData.get("website") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: "Nom et adresse complète requis." };
  const input = parsed.data;

  // Géocodage à la création (Nominatim, gratuit, sans clé).
  const geo = await geocodeAddress(input.address, input.country);
  if (!geo) {
    return {
      error:
        "Adresse introuvable sur la carte — précisez rue, code postal et ville.",
    };
  }

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: input.name,
      address: input.address,
      lat: geo.lat,
      lng: geo.lng,
      city: input.city,
      canton: input.canton,
      country: input.country,
      description: input.description,
      capacity: input.capacity,
      rooms: input.rooms,
      contact: input.website ? { website: input.website } : {},
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Enregistrement du lieu impossible." };

  revalidatePath("/admin/lieux");
  return { success: "Lieu créé et géocodé.", venueId: data.id };
}

/**
 * Édition d'un lieu par l'admin (§3) — re-géocode l'adresse à chaque
 * enregistrement (elle a pu changer). Réservé au rôle admin.
 */
export async function adminUpdateVenue(
  venueId: string,
  _prev: ActionState & { venueId?: string },
  formData: FormData
): Promise<ActionState & { venueId?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return { error: "Réservé à l'administrateur." };

  const parsed = venueSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    country: String(formData.get("country") ?? "CH").toUpperCase(),
    city: String(formData.get("city") ?? "").trim() || null,
    canton: String(formData.get("canton") ?? "").toUpperCase() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    capacity: String(formData.get("capacity") ?? "") || null,
    rooms: String(formData.get("rooms") ?? "") || null,
    website: String(formData.get("website") ?? "").trim() || null,
  });
  if (!parsed.success) return { error: "Nom et adresse complète requis." };
  const input = parsed.data;

  const geo = await geocodeAddress(input.address, input.country);
  if (!geo) return { error: "Adresse introuvable — précisez rue, code postal et ville." };

  const { error } = await supabase
    .from("venues")
    .update({
      name: input.name,
      address: input.address,
      lat: geo.lat,
      lng: geo.lng,
      city: input.city,
      canton: input.canton,
      country: input.country,
      description: input.description,
      capacity: input.capacity,
      rooms: input.rooms,
      contact: input.website ? { website: input.website } : {},
    })
    .eq("id", venueId);

  if (error) return { error: "Mise à jour du lieu impossible." };

  revalidatePath("/admin/lieux");
  revalidatePath(`/lieux/${venueId}`);
  return { success: "Lieu mis à jour.", venueId };
}

/** Suppression d'un lieu par l'admin. */
export async function deleteVenue(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return;

  const venueId = String(formData.get("venue_id") ?? "");
  if (!venueId) return;

  const supabase = await createClient();
  await supabase.from("venues").delete().eq("id", venueId);

  revalidatePath("/admin/lieux");
}
