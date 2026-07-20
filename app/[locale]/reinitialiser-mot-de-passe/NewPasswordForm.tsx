"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updatePassword, type AuthState } from "@/app/actions/auth";

export function NewPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    updatePassword,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label htmlFor="password" className="label">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          minLength={8}
          required
          className="field"
        />
      </div>
      <div>
        <label htmlFor="passwordConfirm" className="label">
          {t("passwordConfirm")}
        </label>
        <input
          id="passwordConfirm"
          name="passwordConfirm"
          type="password"
          minLength={8}
          required
          className="field"
        />
      </div>
      {state.error && (
        <p className="text-sm text-red-700">
          {t(`errors.${state.error}` as Parameters<typeof t>[0])}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary">
        {t("newPasswordButton")}
      </button>
    </form>
  );
}
