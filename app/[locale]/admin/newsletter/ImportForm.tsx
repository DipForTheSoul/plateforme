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
  const translatedError = state.error
    ? t.has(`importErrors.${state.error}`)
      ? t(`importErrors.${state.error}` as Parameters<typeof t>[0])
      : t("importErrors.unknown")
    : null;
  const importedCount = state.success?.startsWith("imported:")
    ? Number(state.success.slice("imported:".length))
    : null;

  return (
    <section className="card p-6">
      <h2 className="mb-1 font-serif text-lg text-soul-brown">{t("importTitle")}</h2>
      <p className="mb-4 text-sm text-soul-bronze"
        dangerouslySetInnerHTML={{ __html: t.raw("importHint") }}
      />
      <form action={formAction} className="flex flex-col gap-3">
        <label htmlFor="csv_file" className="label">{t("importFileLabel")}</label>
        <input id="csv_file" name="csv_file" type="file" accept=".csv,text/csv"
          className="field text-sm file:mr-3 file:rounded-full file:border-0 file:bg-soul-violet file:px-4 file:py-2 file:text-white" />
        <p className="text-center text-xs text-soul-bronze">{t("importOrPaste")}</p>
        <textarea name="csv" rows={6} className="field font-mono text-xs"
          placeholder={t("importPlaceholder")} />
        {translatedError && <p role="alert" className="text-sm text-red-700">{translatedError}</p>}
        {importedCount !== null && <p role="status" className="text-sm text-green-700">{t("importSuccess", {count: importedCount})}</p>}
        <button type="submit" disabled={pending} className="btn-primary self-start">
          {pending ? t("importing") : t("importButton")}
        </button>
      </form>
    </section>
  );
}
