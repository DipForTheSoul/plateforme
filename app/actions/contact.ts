"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth";
import { isRateLimited } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().min(10).max(4000),
  // Pot-de-miel anti-spam : doit rester vide (rempli par les bots).
  website: z.string().max(0),
  locale: z.string().max(5).optional().nullable(),
});

export interface ContactState {
  status: "idle" | "success" | "error";
}

/**
 * Formulaire de contact public (arbitrage Victor). Anti-spam : honeypot +
 * rate-limit. Les messages arrivent dans le back-office admin (une notification
 * e-mail pourra être ajoutée ensuite).
 */
export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
    website: formData.get("website") ?? "",
    locale: formData.get("locale") ?? null,
  });
  if (!parsed.success) return { status: "error" };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(`contact:${ip}`)) return { status: "error" };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase(),
      message: parsed.data.message.trim(),
      locale: parsed.data.locale ?? null,
    });
    if (error) return { status: "error" };
    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}

/** Admin : marquer un message de contact comme traité (ou non). */
export async function toggleContactHandled(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") return;
  const id = String(formData.get("id") ?? "");
  const handled = String(formData.get("handled") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("contact_messages").update({ handled }).eq("id", id);
  revalidatePath("/admin/contact");
}

