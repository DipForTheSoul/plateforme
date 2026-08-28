"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signIn, type AuthState } from "@/app/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signIn,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label htmlFor="email" className="label">
          {t("email")}
        </label>
        <input id="email" name="email" type="email" required className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">
          {t("password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
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
        {t("loginButton")}
      </button>

      <div className="flex flex-col gap-2 text-center text-sm text-soul-bronze">
        <Link href="/mot-de-passe-oublie" className="hover:text-soul-brown">
          {t("forgotPassword")}
        </Link>
        <div className="rounded-xl bg-soul-sand/50 px-4 py-3">
          <p className="font-medium text-soul-brown">{t("visitorNoAccount")}</p>
          <p className="mt-1 text-xs">{t("visitorNoAccountDetail")}</p>
        </div>
        <p className="text-xs">
          {t("practitionerQuestion")}{" "}
          <Link
            href="/inscription"
            className="text-soul-brown underline"
          >
            {t("signupTitle")}
          </Link>
        </p>
      </div>
    </form>
  );
}
