"use client";

import { useActionState } from "react";
import { submitWithoutReset } from "@/components/forms/submitWithoutReset";
import { updateSettings } from "@/app/actions/settings";
import type { ActionState } from "@/app/actions/events";

export function SettingNumberForm({
  settingKey,
  label,
  hint,
  defaultValue,
  suffix,
  min = 1,
  saveLabel,
}: {
  settingKey: string;
  label: string;
  hint?: string;
  defaultValue: string;
  suffix?: string;
  min?: number;
  saveLabel?: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    updateSettings,
    {}
  );

  return (
    <form action={action} onSubmit={submitWithoutReset(action)} className="flex flex-col gap-2">
      <label htmlFor={settingKey} className="label">{label}</label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-2">
          <input
            id={settingKey}
            name={settingKey}
            type="number"
            min={min}
            defaultValue={defaultValue}
            className="field min-w-0 flex-1 sm:!w-28 sm:!flex-none"
          />
          {suffix && <span className="shrink-0 text-sm text-soul-bronze">{suffix}</span>}
        </div>
        <button type="submit" disabled={pending} className="btn-secondary w-full !py-2 sm:w-auto">
          {pending ? "…" : (saveLabel ?? "Enregistrer")}
        </button>
      </div>
      {hint && <p className="text-xs text-soul-bronze">{hint}</p>}
      {state.error && <p className="text-xs text-red-700">{state.error}</p>}
      {state.success && <p className="text-xs text-green-700">{state.success}</p>}
    </form>
  );
}
