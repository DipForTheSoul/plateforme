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

      <div className="flex flex-col gap-1 text-center text-sm text-soul-bronze">
        <Link href="/mot-de-passe-oublie" className="hover:text-soul-brown">
          {t("forgotPassword")}
        </Link>
        <p>
          {t("noAccount")}{" "}
          <Link
            href="/inscription"
            className="font-medium text-soul-brown underline"
          >
            {t("signupTitle")}
          </Link>
        </p>
      </div>
    </form>
  );
}
