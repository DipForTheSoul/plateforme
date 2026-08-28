"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { importContacts } from "@/app/actions/contacts";
import type { ActionState } from "@/app/actions/events";

export function ImportForm() {
  const t = useTranslations("admin.newsletter");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    importContacts,
    {}
  );

  return (
    <section className="card p-6">
      <h2 className="mb-1 font-serif text-lg text-soul-brown">{t("importTitle")}</h2>
      <p className="mb-4 text-sm text-soul-bronze"
        dangerouslySetInnerHTML={{ __html: t.raw("importHint") }}
      />
      <form action={formAction} className="flex flex-col gap-3">
        <textarea name="csv" rows={6} required className="field font-mono text-xs"
          placeholder={t("importPlaceholder")} />
        {state.error && <p className="text-sm text-red-700">{state.error}</p>}
        {state.success && <p className="text-sm text-green-700">{state.success}</p>}
        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending ? t("importing") : t("importButton")}
        </button>
      </form>
    </section>
  );
}
