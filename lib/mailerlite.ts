/**
 * Intégration MailerLite (§7.1) — remplace Resend pour la newsletter.
 * Actif UNIQUEMENT si `MAILERLITE_API_KEY` est défini ; sinon les appels sont
 * des no-op silencieux (la source de vérité reste la table `contacts` Supabase).
 * Le groupe est associé lorsque `MAILERLITE_GROUP_ID` est également défini.
 *
 * API v2 : https://connect.mailerlite.com/api/subscribers (upsert par e-mail).
 */

const API = "https://connect.mailerlite.com/api";

export function mailerliteEnabled(): boolean {
  return Boolean(process.env.MAILERLITE_API_KEY);
}

interface SubscriberInput {
  email: string;
  /** Centres d'intérêt (yoga, danse, méditation…) → étiquettes MailerLite. */
  interests?: string[];
  fields?: Record<string, string>;
}

export interface MailerLiteUpsertResult {
  ok: boolean;
  status: number | null;
  reason?: string;
}

function safeProviderText(value: string) {
  return value
    .replace(/[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})/gi, "adresse masquée@$1")
    .replace(/[\r\n\t]+/g, " ")
    .slice(0, 180);
}

function providerReason(status: number, payload: unknown): string {
  if (status === 429) return "limite temporaire MailerLite atteinte";
  if (status >= 500) return "service MailerLite momentanément indisponible";
  if (payload && typeof payload === "object") {
    const value = payload as { message?: unknown; errors?: Record<string, unknown> };
    const firstError = value.errors && Object.values(value.errors).flat().find(item => typeof item === "string");
    if (typeof firstError === "string") return safeProviderText(firstError);
    if (typeof value.message === "string") return safeProviderText(value.message);
  }
  return `refus MailerLite (${status})`;
}

/** Variante diagnostique réservée aux traitements administratifs. */
export async function upsertSubscriberDetailed(input: SubscriberInput): Promise<MailerLiteUpsertResult> {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) return { ok: false, status: null, reason: "MailerLite non configuré" };

  const groupId = process.env.MAILERLITE_GROUP_ID;
  const body: Record<string, unknown> = {
    email: input.email.toLowerCase(),
    ...(groupId ? { groups: [groupId] } : {}),
    fields: { ...input.fields, ...(input.interests?.length ? { interests: input.interests.join(", ") } : {}) },
  };

  try {
    const res = await fetch(`${API}/subscribers`, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true, status: res.status };
    const payload = await res.json().catch(() => null);
    return { ok: false, status: res.status, reason: providerReason(res.status, payload) };
  } catch (error) {
    return {
      ok: false,
      status: null,
      reason: error instanceof DOMException && error.name === "TimeoutError"
        ? "délai MailerLite dépassé"
        : "connexion MailerLite interrompue",
    };
  }
}

/**
 * Ajoute (ou met à jour) un contact dans le groupe MailerLite, avec ses
 * étiquettes d'intérêt. Renvoie true si l'appel a réussi, false sinon.
 * N'échoue jamais bruyamment : l'inscription locale ne doit pas être bloquée.
 */
export async function upsertSubscriber(input: SubscriberInput): Promise<boolean> {
  return (await upsertSubscriberDetailed(input)).ok;
}
