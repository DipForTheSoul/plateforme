"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/components/forms/submitWithoutReset";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { signUp, type AuthState } from "@/app/actions/auth";

export function SignupForm({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    signUp,
    {}
  );

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-soul-brown">{t("checkEmail")}</p>
        <p className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
          {t("checkEmailSpam")}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} onSubmit={submitWithoutReset(formAction)} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      {/* Pot-de-miel anti-spam */}
      <input
        type="text"
        name="fax"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {/* V2 : inscription réservée aux praticien·nes (pas de compte visiteur). */}
      <input type="hidden" name="role" value="practitioner" />

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="firstName" className="label">{t("firstName")}</label><input id="firstName" name="firstName" required className="field" /></div>
        <div><label htmlFor="lastName" className="label">{t("lastName")}</label><input id="lastName" name="lastName" required className="field" /></div>
      </div>
      <div><label htmlFor="artistName" className="label">{t("artistName")}</label><input id="artistName" name="artistName" required className="field" /></div>
      <div><label htmlFor="bio" className="label">{t("bio")}</label><textarea id="bio" name="bio" required minLength={40} maxLength={1000} rows={5} className="field" placeholder={t("bioPlaceholder")} /><p className="mt-1 text-xs text-soul-bronze">{t("bioHint")}</p></div>
      <fieldset><legend className="label">{t("activities")}</legend><p className="mb-2 text-xs text-soul-bronze">{t("activitiesHint")}</p><div className="grid gap-2 sm:grid-cols-2">{categories.map(category => <label key={category.id} className="flex items-start gap-2 rounded-xl border border-soul-bronze/20 p-3 text-sm"><input type="checkbox" name="specialties" value={category.name} className="mt-0.5" />{category.name}</label>)}</div></fieldset>
      <div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="website" className="label">{t("websiteOptional")}</label><input id="website" name="website" type="url" className="field" placeholder="https://…" /></div><div><label htmlFor="instagram" className="label">{t("instagramOptional")}</label><input id="instagram" name="instagram" type="url" className="field" placeholder="https://instagram.com/…" /></div></div>
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
