"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  consent: z.literal("on"),
  // Champ pot-de-miel anti-spam : doit rester vide (rempli par les bots).
  website: z.string().max(0),
  interests: z.array(z.string()).optional(),
  source: z.string().optional(),
});

export interface NewsletterState {
  status: "idle" | "success" | "error";
}

/** Inscription newsletter (Phase 7) — honeypot + rate-limit + consentement. */
export async function subscribeToNewsletter(
  _prev: NewsletterState,
  formData: FormData
): Promise<NewsletterState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    consent: formData.get("consent"),
    website: formData.get("website") ?? "",
    interests: formData.getAll("interests").map(String).filter(Boolean),
    source: formData.get("source") ?? "site",
  });
  if (!parsed.success) return { status: "error" };

  const ip =
    (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (isRateLimited(`newsletter:${ip}`)) return { status: "error" };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("contacts").insert({
      email: parsed.data.email.toLowerCase(),
      interests: parsed.data.interests ?? [],
      consent: true,
      opt_in_at: new Date().toISOString(),
      source: parsed.data.source,
    });
    // Doublon d'e-mail (unique) : on considère l'inscription réussie.
    if (error && !error.message.includes("duplicate")) return { status: "error" };
    return { status: "success" };
  } catch {
    return { status: "error" };
  }
}
