"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/components/forms/submitWithoutReset";
import { useLocale, useTranslations } from "next-intl";
import { requestPasswordReset, type AuthState } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {}
  );

  if (state.success) {
    return <p className="text-center text-sm text-soul-brown">{t("resetSent")}</p>;
  }

  return (
    <form action={formAction} onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <p className="text-sm text-soul-bronze">{t("resetHelp")}</p>
      <div>
        <label htmlFor="email" className="label">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className="field" />
      </div>
      {state.error && <p role="alert" className="text-sm text-red-700">{t(`errors.${state.error}` as Parameters<typeof t>[0])}</p>}
      <button type="submit" disabled={pending} className="btn-primary">
        {t("resetButton")}
      </button>
    </form>
  );
}
