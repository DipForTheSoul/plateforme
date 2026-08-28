"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { adjustCreditsManually } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/events";

interface Practitioner {
  id: string;
  name: string;
  credits: number;
}

export function AdjustCreditsForm({
  practitioners,
}: {
  practitioners: Practitioner[];
}) {
  const t = useTranslations("admin.credits");
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      await adjustCreditsManually(formData);
      return { success: "OK" };
    },
    {}
  );

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="adjust_practitioner_id">{t("practitioner")}</label>
        <select id="adjust_practitioner_id" name="practitioner_id" required className="field">
          <option value="" disabled>{t("choose")}</option>
          {practitioners.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.credits} {t("creditsLabel").toLowerCase()}
            </option>
          ))}
        </select>
      </div>
      <div className="w-28">
        <label className="label" htmlFor="adjust_amount">{t("deductAmount")}</label>
        <input id="adjust_amount" name="amount" type="number" min={1} defaultValue={1}
          required className="field" />
      </div>
      <div className="min-w-48 flex-1">
        <label className="label" htmlFor="adjust_note">{t("note")}</label>
        <input id="adjust_note" name="note" placeholder={t("deductNotePlaceholder")} className="field" />
      </div>
      <button type="submit" disabled={pending}
        className="rounded-full border border-red-300 bg-white px-6 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
        {pending ? "…" : t("deduct")}
      </button>
      {state.success && <p className="w-full text-xs text-green-700">{state.success}</p>}
    </form>
  );
}
