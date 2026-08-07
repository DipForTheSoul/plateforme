"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signUp, type AuthState } from "@/app/actions/auth";

export function SignupForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    {}
  );

  if (state.success) {
    return <p className="text-center text-sm text-soul-brown">{t("checkEmail")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Pot-de-miel anti-spam */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {/* V2 : inscription réservée aux praticien·nes (pas de compte visiteur). */}
      <input type="hidden" name="role" value="practitioner" />

      <div>
        <label htmlFor="name" className="label">
          Nom public / nom d&apos;artiste
        </label>
        <input id="name" name="name" type="text" className="field" />
      </div>
      <p className="rounded-xl bg-soul-sand/40 px-4 py-3 text-xs text-soul-brown">
        {t("practitionerNote")}
      </p>

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
        {t("signupButton")}
      </button>

      <p className="text-center text-sm text-soul-bronze">
        {t("haveAccount")}{" "}
        <Link href="/connexion" className="font-medium text-soul-brown underline">
          {t("loginTitle")}
        </Link>
      </p>
    </form>
  );
}
