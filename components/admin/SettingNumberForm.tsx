"use client";

import { useActionState } from "react";
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
    <form action={action} className="flex flex-col gap-2">
      <label htmlFor={settingKey} className="label">{label}</label>
      <div className="flex items-center gap-2">
        <input
          id={settingKey}
          name={settingKey}
          type="number"
          min={min}
          defaultValue={defaultValue}
          className="field !max-w-28"
        />
        {suffix && <span className="text-sm text-soul-bronze">{suffix}</span>}
        <button type="submit" disabled={pending} className="btn-secondary !py-2">
          {pending ? "…" : (saveLabel ?? "Enregistrer")}
        </button>
      </div>
      {hint && <p className="text-xs text-soul-bronze">{hint}</p>}
      {state.error && <p className="text-xs text-red-700">{state.error}</p>}
      {state.success && <p className="text-xs text-green-700">{state.success}</p>}
    </form>
  );
}
