/**
 * Intégration MailerLite (§7.1) — remplace Resend pour la newsletter.
 * Actif UNIQUEMENT si `MAILERLITE_API_KEY` est défini ; sinon les appels sont
 * des no-op silencieux (la source de vérité reste la table `contacts` Supabase).
 * // EN ATTENTE CLIENT — Didier fournit la clé API et l'ID du groupe.
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

/**
 * Ajoute (ou met à jour) un contact dans le groupe MailerLite, avec ses
 * étiquettes d'intérêt. Renvoie true si l'appel a réussi, false sinon.
 * N'échoue jamais bruyamment : l'inscription locale ne doit pas être bloquée.
 */
export async function upsertSubscriber(input: SubscriberInput): Promise<boolean> {
  const key = process.env.MAILERLITE_API_KEY;
  if (!key) return false;

  const groupId = process.env.MAILERLITE_GROUP_ID;
  const body: Record<string, unknown> = {
    email: input.email.toLowerCase(),
    ...(input.fields ? { fields: input.fields } : {}),
    ...(groupId ? { groups: [groupId] } : {}),
    // Les intérêts deviennent des étiquettes (tags) côté MailerLite.
    ...(input.interests?.length ? { fields: { interests: input.interests.join(", ") } } : {}),
  };

  try {
    const res = await fetch(`${API}/subscribers`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}
