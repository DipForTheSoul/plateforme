"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { requestPasswordReset, type AuthState } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    requestPasswordReset,
    {}
  );

  if (state.success) {
    return <p className="text-center text-sm text-soul-brown">{t("resetSent")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-sm text-soul-bronze">{t("resetHelp")}</p>
      <div>
        <label htmlFor="email" className="label">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className="field" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary">
        {t("resetButton")}
      </button>
    </form>
  );
}
