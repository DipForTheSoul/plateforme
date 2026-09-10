"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { webUrlSchema } from '@/lib/web-url';
import { createClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";
import {readVenuePoint} from '@/lib/address-search';
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
  website: webUrlSchema,
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

  const isAdmin = (await getCurrentProfile())?.role === 'admin';
  const isPublic = isAdmin && formData.get('is_public') === 'true';

  let geo;
  try {geo = readVenuePoint(formData);}
  catch {return {error: 'Adresse sélectionnée invalide. Sélectionnez-la à nouveau ou utilisez la saisie manuelle.'};}
  const manual = formData.get('address_mode') === 'manual';
  // Manual entry never requires locating a pin or waiting for a geocoder.
  if (manual) geo = null;
  else if (!geo) geo = await geocodeAddress([input.address, input.city].filter(Boolean).join(', '), input.country);
  if (!geo && !manual) {
    return {
      error:
        "Adresse introuvable. Choisissez la saisie manuelle : Didier vérifiera l’adresse avec votre événement. Votre saisie est conservée.",
    };
  }

  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: input.name,
      address: input.address,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      review_status: isAdmin ? 'approved' : 'pending',
      is_public: isPublic,
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
  revalidatePath("/[locale]/lieux", "page");
  return { success: "Lieu enregistré.", venueId: data.id };
}

/**
 * Édition d'un lieu par l'admin — géocode uniquement une adresse changée.
 */
export async function adminUpdateVenue(
  venueId: string,
  _prev: ActionState & { venueId?: string },
  formData: FormData
): Promise<ActionState & { venueId?: string }> {
  const supabase = await createClient();
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return { error: "Réservé à l'administrateur." };

  const publication = formData.get('is_public');
  if (publication !== null && publication !== 'true' && publication !== 'false') {
    return {error: 'Choisissez le statut de publication du lieu.'};
  }

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

  const {data:existing,error:readError} = await supabase.from('venues').select('address,country,lat,lng,contact').eq('id',venueId).maybeSingle();
  if (readError || !existing) return {error: 'Lieu introuvable ou momentanément inaccessible.'};
  const unchanged = existing.address === input.address && existing.country === input.country && existing.lat != null && existing.lng != null;
  const geo = unchanged ? {lat:existing.lat,lng:existing.lng} : await geocodeAddress([input.address,input.city].filter(Boolean).join(', '),input.country);
  // Didier may correct a manually entered place even when no coordinates exist.
  // Never preserve stale coordinates after changing the address.

  const { error } = await supabase
    .from("venues")
    .update({
      name: input.name,
      address: input.address,
      lat: geo?.lat ?? null,
      lng: geo?.lng ?? null,
      city: input.city,
      canton: input.canton,
      country: input.country,
      description: input.description,
      capacity: input.capacity,
      rooms: input.rooms,
      contact: { ...existing.contact, website: input.website ?? undefined },
      // A stale pre-deployment form must not silently unpublish a venue.
      ...(publication === null ? {} : { is_public: publication === 'true' }),
      ...(publication === 'true' ? { review_status: 'approved' } : {}),
    })
    .eq("id", venueId);

  if (error) return { error: "Mise à jour du lieu impossible." };

  revalidatePath("/admin/lieux");
  revalidatePath(`/lieux/${venueId}`);
  revalidatePath("/[locale]/lieux", "page");
  revalidatePath("/[locale]/lieux/[id]", "page");
  revalidatePath("/[locale]/experiences/[slug]", "page");
  return { success: "Lieu mis à jour.", venueId };
}

/** Suppression d'un lieu par l'admin. */
export async function deleteVenue(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") throw new Error('Accès administrateur requis.');

  const venueId = String(formData.get("venue_id") ?? "");
  if (!venueId) return;

  const supabase = await createClient();
  const {error}=await supabase.from("venues").delete().eq("id", venueId);
  if(error)throw new Error('Le lieu n’a pas pu être supprimé. Il peut être lié à une expérience.');

  revalidatePath("/admin/lieux");
}
