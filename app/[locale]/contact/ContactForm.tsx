"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sendContactMessage, type ContactState } from "@/app/actions/contact";

export function ContactForm() {
  const t = useTranslations("contact");
  const locale = useLocale();
  const [state, action, pending] = useActionState<ContactState, FormData>(
    sendContactMessage,
    { status: "idle" }
  );

  if (state.status === "success") {
    return (
      <p className="rounded-2xl border border-green-300 bg-green-50 p-5 text-sm text-green-800">
        {t("success")}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Pot-de-miel anti-spam */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <input type="hidden" name="locale" value={locale} />

      <div>
        <label htmlFor="name" className="label">
          {t("name")}
        </label>
        <input id="name" name="name" required minLength={2} maxLength={120} className="field" />
      </div>
      <div>
        <label htmlFor="email" className="label">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className="field" />
      </div>
      <div>
        <label htmlFor="message" className="label">
          {t("message")}
        </label>
        <textarea id="message" name="message" required minLength={10} maxLength={4000} rows={6} className="field" />
      </div>

      <label className="flex items-start gap-2 text-sm text-soul-ink/80">
        <input type="checkbox" name="newsletter_consent" value="on" className="mt-0.5" />
        <span>{t("newsletterConsent")}</span>
      </label>

      {state.status === "error" && (
        <p className="text-sm text-red-700">{t("error")}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary self-start">
        {pending ? t("sending") : t("send")}
      </button>
    </form>
  );
}
