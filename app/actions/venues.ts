"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import type { ActionState } from "@/app/actions/events";

const venueSchema = z.object({
  name: z.string().min(2).max(140),
  address: z.string().min(5).max(300),
  country: z.string().length(2).default("CH"),
  canton: z.string().max(2).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  capacity: z.coerce.number().int().positive().optional().nullable(),
  rooms: z.coerce.number().int().positive().optional().nullable(),
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
    canton: String(formData.get("canton") ?? "").toUpperCase() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    capacity: String(formData.get("capacity") ?? "") || null,
    rooms: String(formData.get("rooms") ?? "") || null,
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
      canton: input.canton,
      country: input.country,
      description: input.description,
      capacity: input.capacity,
      rooms: input.rooms,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Enregistrement du lieu impossible." };

  revalidatePath("/admin/lieux");
  return { success: "Lieu créé et géocodé.", venueId: data.id };
}
