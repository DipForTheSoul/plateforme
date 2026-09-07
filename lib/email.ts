import "server-only";

import { Resend } from "resend";

/**
 * Envoi d'e-mails transactionnels via Resend (plan gratuit : 3000/mois).
 * Repli (BUILD-BRIEF.md §2.1) : tant que RESEND_API_KEY n'est pas renseignée,
 * un diagnostic sans contenu personnel est logué — aucun blocage du flux.
 * Rodrigue : vérifier le domaine forthesoul.ch dans Resend avant d'activer
 * EMAIL_FROM="ForTheSoul <welcome@forthesoul.ch>".
 */

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  /** Adresse de réponse (ex. l'e-mail de la personne qui écrit via le formulaire). */
  replyTo?: string;
}

export async function sendEmail({ to, subject, html, replyTo }: SendEmailInput): Promise<boolean> {
  if (process.env.LOCAL_MAILPIT_URL) {
    // Test mailbox is strictly loopback-only and cannot be activated on Vercel.
    if (process.env.QA_LOCAL !== '1' || process.env.VERCEL || process.env.LOCAL_MAILPIT_URL !== 'http://127.0.0.1:54324') return false;
    try {
      const response = await fetch('http://127.0.0.1:54324/api/v1/send', {method:'POST',headers:{'content-type':'application/json'},signal:AbortSignal.timeout(5000),body:JSON.stringify({From:{Email:'app@forthesoul.test',Name:'ForTheSoul QA'},To:[{Email:to}],Subject:subject,HTML:html,...(replyTo?{ReplyTo:[{Email:replyTo}]}:{})})});
      return response.ok;
    } catch { console.error('[email] Boîte locale de test indisponible.'); return false; }
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "ForTheSoul <welcome@forthesoul.ch>";

  if (!apiKey) {
    console.info('[email] Envoi désactivé : RESEND_API_KEY absente.');
    return false;
  }

  try {
    const resend = new Resend(apiKey);
    const {data,error} = await resend.emails.send({ from, to, subject, html, replyTo });
    if(error){console.error('[email] Envoi refusé par Resend:',error.name);return false;}
    return Boolean(data?.id);
  } catch {
    // Un e-mail qui échoue ne doit jamais casser le parcours utilisateur.
    console.error("[email] Échec d'envoi Resend : vérifier le service et sa configuration.");
    return false;
  }
}
