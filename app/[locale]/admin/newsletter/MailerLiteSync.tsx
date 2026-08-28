"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { syncContactsToMailerLite } from "@/app/actions/contacts";
import type { ActionState } from "@/app/actions/events";

export function MailerLiteSync() {
  const t = useTranslations("admin.newsletter");
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async () => syncContactsToMailerLite(),
    {}
  );

  return (
    <form action={action} className="mt-4 border-t border-soul-bronze/10 pt-4">
      <p className="mb-2 text-xs font-medium text-soul-brown">
        {t("syncTitle")}
      </p>
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? t("syncing") : `⟳ ${t("syncButton")}`}
      </button>
      {state.error && <p className="mt-2 text-xs text-red-700">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-green-700">{state.success}</p>}
    </form>
  );
}
