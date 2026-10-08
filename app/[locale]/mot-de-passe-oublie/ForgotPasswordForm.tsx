"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { requestPasswordReset } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const [state, setState] = useState<{ error?: string; success?: string }>({});
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setPending(true);
    setState({});

    const allowed = await requestPasswordReset({}, formData);
    if (allowed.error) {
      setState({ error: allowed.error });
      setPending(false);
      return;
    }
    if (allowed.success !== "resetAllowed") {
      setState({ success: "resetSent" });
      setPending(false);
      return;
    }

    const email = String(formData.get("email") ?? "").trim();
    const localizedResetPath = ["de", "en"].includes(locale)
      ? `/${locale}/reinitialiser-mot-de-passe`
      : "/reinitialiser-mot-de-passe";
    const callback = new URL("/api/auth/callback", window.location.origin);
    callback.searchParams.set("next", localizedResetPath);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: callback.toString(),
      });

      // Ne jamais révéler si l'adresse correspond à un compte. Seule une panne
      // technique générale est affichée à l'utilisateur.
      if (error && (!error.status || error.status >= 500)) {
        setState({ error: "generic" });
      } else {
        setState({ success: "resetSent" });
      }
    } catch {
      setState({ error: "generic" });
    } finally {
      setPending(false);
    }
  }

  if (state.success) {
    return <p className="text-center text-sm text-soul-brown">{t("resetSent")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
