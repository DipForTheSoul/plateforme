"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import type { ActionState } from "@/app/actions/events";

/**
 * Enregistre les paramètres éditables en admin (table `settings`, §4.4/§6).
 * Réservé au rôle admin. Upsert clé par clé.
 */
export async function updateSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return { error: "Réservé à l'administrateur." };
  }

  // Clés autorisées à l'édition (bornées volontairement).
  const keys = [
    "exchange_rate_eur",
    "featured_default_days",
    "pack_default_valid_days",
    "event_delist_days",
    "payment_beneficiary",
    "payment_iban",
    "price_pack_1",
    "price_pack_5",
    "price_pack_10",
    "promo_label",
    "promo_discount_percent",
  ];

  // Ces clés doivent pouvoir être VIDÉES (ex. arrêter une promo) → on les écrit
  // même vides ; les autres, une valeur vide = « ne pas changer ».
  const alwaysWritable = new Set(["promo_label", "promo_discount_percent"]);
  const rows = keys
    .map((key) => ({ key, value: String(formData.get(key) ?? "").trim() }))
    .filter((r) => r.value !== "" || alwaysWritable.has(r.key));

  // Validation légère : le taux doit être un nombre > 0.
  const rate = rows.find((r) => r.key === "exchange_rate_eur");
  if (rate && !(Number(rate.value) > 0)) {
    return { error: "Le taux de change doit être un nombre positif (ex. 1.05)." };
  }
  // Le % de remise, si renseigné, doit être entre 1 et 99.
  const promoPct = rows.find((r) => r.key === "promo_discount_percent");
  if (promoPct && promoPct.value !== "") {
    const n = Number(promoPct.value);
    if (!Number.isFinite(n) || n < 1 || n > 99) {
      return { error: "La remise doit être un pourcentage entre 1 et 99." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert(
      rows.map((r) => ({ key: r.key, value: r.value, updated_at: new Date().toISOString() })),
      { onConflict: "key" }
    );

  if (error) return { error: "Enregistrement impossible." };

  revalidatePath("/admin/parametres");
  revalidatePath("/", "layout"); // rafraîchit le taux affiché côté visiteur
  return { success: "Paramètres enregistrés." };
}
