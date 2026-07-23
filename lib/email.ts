import "server-only";

import { Resend } from "resend";

/**
 * Envoi d'e-mails transactionnels via Resend (plan gratuit : 3000/mois).
 * Repli (BUILD-BRIEF.md §2.1) : tant que RESEND_API_KEY n'est pas renseignée,
 * les e-mails sont logués en console — aucun blocage du flux.
 * Rodrigue : vérifier le domaine forthesoul.ch dans Resend avant d'activer
 * EMAIL_FROM="ForTheSoul <welcome@forthesoul.ch>".
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "ForTheSoul <welcome@forthesoul.ch>";

  if (!apiKey) {
    console.info(
      `[email — mode console, RESEND_API_KEY absente]\nÀ: ${to}\nSujet: ${subject}\n${html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`
    );
    return;
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({ from, to, subject, html });
  } catch (error) {
    // Un e-mail qui échoue ne doit jamais casser le parcours utilisateur.
    console.error("[email] Échec d'envoi Resend:", error);
  }
}
