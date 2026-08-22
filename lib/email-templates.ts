import "server-only";

/**
 * Gabarits d'e-mails transactionnels (Phase 7).
 * HTML volontairement simple et compatible clients mail. Identité : palette
 * chaleureuse de forthesoul.ch (brun #443420, crème #fef6ed, bronze #9e7c52).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthesoul.ch";

function layout(title: string, body: string): string {
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:#fef6ed;font-family:Georgia,'Times New Roman',serif;color:#171200;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef6ed;padding:40px 16px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
          <tr>
            <td style="text-align:center;padding-bottom:32px;">
              <img src="${SITE_URL}/logo.png" alt="ForTheSoul" width="180" style="display:block;margin:0 auto;" />
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:#443420;">${title}</h1>
              ${body}
              <p style="margin:32px 0 0;font-size:14px;color:#9e7c52;">
                Avec cœur,<br/>Didier &amp; l'équipe ForTheSoul
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding-top:24px;font-size:12px;color:#9e7c52;">
              <a href="${SITE_URL}" style="color:#9e7c52;text-decoration:none;">forthesoul.ch</a> — Expériences conscientes, validées avec soin.
            </td>
          </tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const p = (text: string) =>
  `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;">${text}</p>`;

const button = (href: string, label: string) =>
  `<p style="margin:24px 0;text-align:center;"><a href="${href}" style="display:inline-block;background:#5D4D9E;color:#ffffff;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:15px;font-weight:600;">${label}</a></p>`;

/** Confirmation de dépôt d'un événement (praticien). */
export function submissionReceivedEmail(practitionerName: string, eventTitle: string) {
  return {
    subject: `Votre expérience « ${eventTitle} » est bien reçue`,
    html: layout(
      "Merci pour votre dépôt !",
      p(`Bonjour ${practitionerName},`) +
        p(
          `Votre expérience <strong>« ${eventTitle} »</strong> a bien été transmise. Didier la relit personnellement — vous recevrez une réponse très prochainement.`
        ) +
        button(`${SITE_URL}/espace-praticien/evenements`, "Suivre mes expériences")
    ),
  };
}

/** Événement validé (avec message optionnel de l'admin). */
export function eventApprovedEmail(
  practitionerName: string,
  eventTitle: string,
  eventSlug: string,
  adminMessage?: string | null
) {
  return {
    subject: `« ${eventTitle} » est en ligne ✨`,
    html: layout(
      "Votre expérience est publiée !",
      p(`Bonjour ${practitionerName},`) +
        p(
          `Bonne nouvelle : <strong>« ${eventTitle} »</strong> a été validée et est désormais visible sur ForTheSoul.`
        ) +
        (adminMessage ? p(`<em>Message de Didier :</em> ${adminMessage}`) : "") +
        button(`${SITE_URL}/experiences/${eventSlug}`, "Voir la page publique")
    ),
  };
}

/** Événement refusé (avec message de l'admin). */
export function eventRejectedEmail(
  practitionerName: string,
  eventTitle: string,
  adminMessage?: string | null
) {
  return {
    subject: `« ${eventTitle} » — des ajustements sont nécessaires`,
    html: layout(
      "Votre expérience n'a pas pu être validée",
      p(`Bonjour ${practitionerName},`) +
        p(
          `Après relecture, <strong>« ${eventTitle} »</strong> n'a pas pu être publiée en l'état.`
        ) +
        (adminMessage
          ? p(`<em>Message de Didier :</em> ${adminMessage}`)
          : p("N'hésitez pas à nous écrire pour en discuter.")) +
        p("Vous pouvez modifier votre annonce et la soumettre à nouveau.") +
        button(`${SITE_URL}/espace-praticien/evenements`, "Modifier mon annonce")
    ),
  };
}

/** Fiche praticien refusée — avec le motif de Didier. */
export function practitionerRejectedEmail(
  practitionerName: string,
  adminMessage?: string | null
) {
  return {
    subject: "Votre fiche praticien ForTheSoul — des précisions nécessaires",
    html: layout(
      "Votre fiche n'a pas pu être validée",
      p(`Bonjour ${practitionerName},`) +
        p(
          "Après relecture, votre fiche praticien n'a pas pu être validée en l'état."
        ) +
        (adminMessage
          ? p(`<em>Motif indiqué par Didier :</em> ${adminMessage}`)
          : p("N'hésitez pas à nous écrire pour en discuter.")) +
        p("Vous pouvez compléter votre fiche et la soumettre à nouveau.") +
        button(`${SITE_URL}/espace-praticien/profil`, "Compléter ma fiche")
    ),
  };
}

/** Fiche praticien validée. */
export function practitionerApprovedEmail(practitionerName: string, slug: string) {
  return {
    subject: "Bienvenue parmi les praticien·nes ForTheSoul 🌿",
    html: layout(
      "Votre fiche praticien est validée",
      p(`Bonjour ${practitionerName},`) +
        p(
          "Votre fiche a été validée par Didier : elle est désormais visible dans l'annuaire ForTheSoul, et vous pouvez publier vos premières expériences."
        ) +
        button(`${SITE_URL}/praticiens/${slug}`, "Voir ma fiche publique")
    ),
  };
}

/** Notification de message de contact (envoyée à Didier). */
export function contactNotificationEmail(name: string, email: string, message: string) {
  return {
    subject: `Nouveau message de ${name} — ForTheSoul`,
    html: layout(
      "Nouveau message de contact",
      p(`<strong>${name}</strong> (${email}) vous a écrit :`) +
        `<div style="margin:16px 0;padding:16px;background:#fef6ed;border-radius:12px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${message}</div>` +
        p(`<em style="font-size:13px;color:#9e7c52;">Répondez directement à cet e-mail pour joindre ${name}. Message aussi disponible dans le back-office.</em>`)
    ),
  };
}
