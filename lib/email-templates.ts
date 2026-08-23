import "server-only";

import type { Locale } from "@/types/database";

/**
 * Gabarits d'e-mails transactionnels (Phase 7).
 * HTML volontairement simple et compatible clients mail. Identité : palette
 * chaleureuse de forthesoul.ch (brun #443420, crème #fef6ed, bronze #9e7c52).
 * Multilingue : fr / de / en selon la preferred_lang du profil.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthesoul.ch";

type Lang = Locale;

const i18n = {
  closing: {
    fr: "Avec cœur,<br/>Didier &amp; l'équipe ForTheSoul",
    de: "Herzlich,<br/>Didier &amp; das ForTheSoul-Team",
    en: "With heart,<br/>Didier &amp; the ForTheSoul team",
  },
  tagline: {
    fr: "Expériences conscientes, validées avec soin.",
    de: "Bewusste Erlebnisse, sorgfältig geprüft.",
    en: "Conscious experiences, carefully curated.",
  },
  submissionReceived: {
    fr: {
      subject: (title: string) => `Votre expérience « ${title} » est bien reçue`,
      heading: "Merci pour votre dépôt !",
      body: (name: string, title: string) =>
        `Bonjour ${name},\n\nVotre expérience <strong>« ${title} »</strong> a bien été transmise. Didier la relit personnellement — vous recevrez une réponse très prochainement.`,
      cta: "Suivre mes expériences",
    },
    de: {
      subject: (title: string) => `Ihr Erlebnis « ${title} » wurde empfangen`,
      heading: "Vielen Dank für Ihre Einreichung!",
      body: (name: string, title: string) =>
        `Hallo ${name},\n\nIhr Erlebnis <strong>« ${title} »</strong> wurde erfolgreich übermittelt. Didier prüft es persönlich — Sie erhalten in Kürze eine Antwort.`,
      cta: "Meine Erlebnisse verfolgen",
    },
    en: {
      subject: (title: string) => `Your experience "${title}" has been received`,
      heading: "Thank you for your submission!",
      body: (name: string, title: string) =>
        `Hello ${name},\n\nYour experience <strong>"${title}"</strong> has been submitted successfully. Didier reviews each one personally — you'll hear back very soon.`,
      cta: "Track my experiences",
    },
  },
  eventApproved: {
    fr: {
      subject: (title: string) => `« ${title} » est en ligne ✨`,
      heading: "Votre expérience est publiée !",
      body: (name: string, title: string) =>
        `Bonjour ${name},\n\nBonne nouvelle : <strong>« ${title} »</strong> a été validée et est désormais visible sur ForTheSoul.`,
      adminMsg: "Message de Didier :",
      cta: "Voir la page publique",
    },
    de: {
      subject: (title: string) => `« ${title} » ist online ✨`,
      heading: "Ihr Erlebnis ist veröffentlicht!",
      body: (name: string, title: string) =>
        `Hallo ${name},\n\nGute Nachricht: <strong>« ${title} »</strong> wurde validiert und ist ab sofort auf ForTheSoul sichtbar.`,
      adminMsg: "Nachricht von Didier:",
      cta: "Öffentliche Seite ansehen",
    },
    en: {
      subject: (title: string) => `"${title}" is now live ✨`,
      heading: "Your experience is published!",
      body: (name: string, title: string) =>
        `Hello ${name},\n\nGreat news: <strong>"${title}"</strong> has been approved and is now visible on ForTheSoul.`,
      adminMsg: "Message from Didier:",
      cta: "View public page",
    },
  },
  eventRejected: {
    fr: {
      subject: (title: string) => `« ${title} » — des ajustements sont nécessaires`,
      heading: "Votre expérience n'a pas pu être validée",
      body: (name: string, title: string) =>
        `Bonjour ${name},\n\nAprès relecture, <strong>« ${title} »</strong> n'a pas pu être publiée en l'état.`,
      adminMsg: "Message de Didier :",
      fallback: "N'hésitez pas à nous écrire pour en discuter.",
      editNote: "Vous pouvez modifier votre annonce et la soumettre à nouveau.",
      cta: "Modifier mon annonce",
    },
    de: {
      subject: (title: string) => `« ${title} » — Anpassungen erforderlich`,
      heading: "Ihr Erlebnis konnte nicht validiert werden",
      body: (name: string, title: string) =>
        `Hallo ${name},\n\nNach Prüfung konnte <strong>« ${title} »</strong> in der jetzigen Form nicht veröffentlicht werden.`,
      adminMsg: "Nachricht von Didier:",
      fallback: "Zögern Sie nicht, uns für eine Besprechung zu kontaktieren.",
      editNote: "Sie können Ihre Anzeige anpassen und erneut einreichen.",
      cta: "Anzeige bearbeiten",
    },
    en: {
      subject: (title: string) => `"${title}" — adjustments needed`,
      heading: "Your experience could not be approved",
      body: (name: string, title: string) =>
        `Hello ${name},\n\nAfter review, <strong>"${title}"</strong> could not be published as is.`,
      adminMsg: "Message from Didier:",
      fallback: "Feel free to reach out to discuss.",
      editNote: "You can edit your listing and resubmit.",
      cta: "Edit my listing",
    },
  },
  practitionerApproved: {
    fr: {
      subject: "Bienvenue parmi les praticien·nes ForTheSoul 🌿",
      heading: "Votre fiche praticien est validée",
      body: (name: string) =>
        `Bonjour ${name},\n\nVotre fiche a été validée par Didier : elle est désormais visible dans l'annuaire ForTheSoul, et vous pouvez publier vos premières expériences.`,
      cta: "Voir ma fiche publique",
    },
    de: {
      subject: "Willkommen bei den ForTheSoul-Anbietern 🌿",
      heading: "Ihr Anbieterprofil ist validiert",
      body: (name: string) =>
        `Hallo ${name},\n\nIhr Profil wurde von Didier validiert: Es ist ab sofort im ForTheSoul-Verzeichnis sichtbar, und Sie können Ihre ersten Erlebnisse veröffentlichen.`,
      cta: "Mein öffentliches Profil ansehen",
    },
    en: {
      subject: "Welcome to ForTheSoul practitioners 🌿",
      heading: "Your practitioner profile is approved",
      body: (name: string) =>
        `Hello ${name},\n\nYour profile has been approved by Didier: it's now visible in the ForTheSoul directory, and you can publish your first experiences.`,
      cta: "View my public profile",
    },
  },
  practitionerRejected: {
    fr: {
      subject: "Votre fiche praticien ForTheSoul — des précisions nécessaires",
      heading: "Votre fiche n'a pas pu être validée",
      body: (name: string) =>
        `Bonjour ${name},\n\nAprès relecture, votre fiche praticien n'a pas pu être validée en l'état.`,
      adminMsg: "Motif indiqué par Didier :",
      fallback: "N'hésitez pas à nous écrire pour en discuter.",
      editNote: "Vous pouvez compléter votre fiche et la soumettre à nouveau.",
      cta: "Compléter ma fiche",
    },
    de: {
      subject: "Ihr ForTheSoul-Anbieterprofil — Präzisierungen nötig",
      heading: "Ihr Profil konnte nicht validiert werden",
      body: (name: string) =>
        `Hallo ${name},\n\nNach Prüfung konnte Ihr Anbieterprofil in der jetzigen Form nicht validiert werden.`,
      adminMsg: "Begründung von Didier:",
      fallback: "Zögern Sie nicht, uns für eine Besprechung zu kontaktieren.",
      editNote: "Sie können Ihr Profil ergänzen und erneut einreichen.",
      cta: "Profil vervollständigen",
    },
    en: {
      subject: "Your ForTheSoul practitioner profile — details needed",
      heading: "Your profile could not be approved",
      body: (name: string) =>
        `Hello ${name},\n\nAfter review, your practitioner profile could not be approved as is.`,
      adminMsg: "Reason from Didier:",
      fallback: "Feel free to reach out to discuss.",
      editNote: "You can complete your profile and resubmit.",
      cta: "Complete my profile",
    },
  },
} as const;

function layout(lang: Lang, title: string, body: string): string {
  return `<!doctype html>
<html lang="${lang}">
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
                ${i18n.closing[lang]}
              </p>
            </td>
          </tr>
          <tr>
            <td style="text-align:center;padding-top:24px;font-size:12px;color:#9e7c52;">
              <a href="${SITE_URL}" style="color:#9e7c52;text-decoration:none;">forthesoul.ch</a> — ${i18n.tagline[lang]}
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
export function submissionReceivedEmail(practitionerName: string, eventTitle: string, lang: Lang = "fr") {
  const t = i18n.submissionReceived[lang];
  return {
    subject: t.subject(eventTitle),
    html: layout(
      lang,
      t.heading,
      p(t.body(practitionerName, eventTitle)) +
        button(`${SITE_URL}/espace-praticien/evenements`, t.cta)
    ),
  };
}

/** Événement validé (avec message optionnel de l'admin). */
export function eventApprovedEmail(
  practitionerName: string,
  eventTitle: string,
  eventSlug: string,
  adminMessage?: string | null,
  lang: Lang = "fr"
) {
  const t = i18n.eventApproved[lang];
  return {
    subject: t.subject(eventTitle),
    html: layout(
      lang,
      t.heading,
      p(t.body(practitionerName, eventTitle)) +
        (adminMessage ? p(`<em>${t.adminMsg}</em> ${adminMessage}`) : "") +
        button(`${SITE_URL}/experiences/${eventSlug}`, t.cta)
    ),
  };
}

/** Événement refusé (avec message de l'admin). */
export function eventRejectedEmail(
  practitionerName: string,
  eventTitle: string,
  adminMessage?: string | null,
  lang: Lang = "fr"
) {
  const t = i18n.eventRejected[lang];
  return {
    subject: t.subject(eventTitle),
    html: layout(
      lang,
      t.heading,
      p(t.body(practitionerName, eventTitle)) +
        (adminMessage
          ? p(`<em>${t.adminMsg}</em> ${adminMessage}`)
          : p(t.fallback)) +
        p(t.editNote) +
        button(`${SITE_URL}/espace-praticien/evenements`, t.cta)
    ),
  };
}

/** Fiche praticien validée. */
export function practitionerApprovedEmail(practitionerName: string, slug: string, lang: Lang = "fr") {
  const t = i18n.practitionerApproved[lang];
  return {
    subject: t.subject,
    html: layout(
      lang,
      t.heading,
      p(t.body(practitionerName)) +
        button(`${SITE_URL}/praticiens/${slug}`, t.cta)
    ),
  };
}

/** Fiche praticien refusée — avec le motif de Didier. */
export function practitionerRejectedEmail(
  practitionerName: string,
  adminMessage?: string | null,
  lang: Lang = "fr"
) {
  const t = i18n.practitionerRejected[lang];
  return {
    subject: t.subject,
    html: layout(
      lang,
      t.heading,
      p(t.body(practitionerName)) +
        (adminMessage
          ? p(`<em>${t.adminMsg}</em> ${adminMessage}`)
          : p(t.fallback)) +
        p(t.editNote) +
        button(`${SITE_URL}/espace-praticien/profil`, t.cta)
    ),
  };
}

/** Notification de message de contact (envoyée à Didier — toujours en français). */
export function contactNotificationEmail(name: string, email: string, message: string) {
  return {
    subject: `Nouveau message de ${name} — ForTheSoul`,
    html: layout(
      "fr",
      "Nouveau message de contact",
      p(`<strong>${name}</strong> (${email}) vous a écrit :`) +
        `<div style="margin:16px 0;padding:16px;background:#fef6ed;border-radius:12px;font-size:15px;line-height:1.6;white-space:pre-wrap;">${message}</div>` +
        p(`<em style="font-size:13px;color:#9e7c52;">Répondez directement à cet e-mail pour joindre ${name}. Message aussi disponible dans le back-office.</em>`)
    ),
  };
}
