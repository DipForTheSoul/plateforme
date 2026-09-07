"use client";
import { startTransition, useEffect, useRef, useState, type FormEvent } from 'react';

type Draft = { at: number; fields: Record<string, string[]>; extra: Record<string, unknown> };
const EMPTY = {};

/** Tab-local, account-scoped drafts; never capture passwords, files or action tokens. */
export function useDraftForm(key: string, extra: Record<string, unknown> = EMPTY, restoreExtra?: (data: Record<string, unknown>, fields: Record<string, string[]>) => void) {
  const ref = useRef<HTMLFormElement>(null);
  const latest = useRef({ extra, restoreExtra });
  useEffect(() => { latest.current = { extra, restoreExtra }; });
  const [storageError, setStorageError] = useState(false);
  const restored = useRef(false);
  const dirty = useRef(false);
  const storageKey = `fts.draft.v1:${key}`;

  function save() {
    if (!ref.current || !restored.current || !dirty.current) return;
    const fields: Record<string, string[]> = {};
    for (const element of Array.from(ref.current.elements)) {
      if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
      if (!element.name || element.name.startsWith('$') || ['password', 'file', 'submit', 'hidden'].includes(element.type)) continue;
      fields[element.name] ??= [];
      if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type) && !element.checked) continue;
      fields[element.name].push(element.value);
    }
    try { sessionStorage.setItem(storageKey, JSON.stringify({ at: Date.now(), fields, extra: latest.current.extra })); setStorageError(false); }
    catch { setStorageError(true); }
  }

  useEffect(() => {
    restored.current = false;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const draft: Draft = JSON.parse(raw);
        if (Date.now() - draft.at < 7 * 86400000 && draft.fields && draft.extra) {
          latest.current.restoreExtra?.(draft.extra, draft.fields);
          for (const element of Array.from(ref.current?.elements ?? [])) {
            if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
            const values = draft.fields[element.name];
            if (!Array.isArray(values) || !values.every(v => typeof v === 'string') || ['password', 'file', 'hidden'].includes(element.type)) continue;
            if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) element.checked = values.includes(element.value);
            else element.value = values[0] ?? '';
          }
          dirty.current = true;
        }
      }
    } catch { /* Invalid/disabled storage must not prevent editing. */ }
    restored.current = true;
  }, [storageKey]);

  // Controlled state (photos, venue, recurrence) is saved after React commits it.
  const serializedExtra = JSON.stringify(extra);
  const previousExtra = useRef(serializedExtra);
  useEffect(() => {
    // Do not save initial defaults while restoreExtra is scheduling its state update.
    // React StrictMode replays mount effects and would otherwise restore that empty copy.
    if (serializedExtra === previousExtra.current) return;
    dirty.current = true;
    previousExtra.current = serializedExtra;
    // Synchronizing browser storage; the only state update reports storage failure.
    save();
    // Snapshot changes only; callbacks read their current values through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serializedExtra]);

  function clear() { dirty.current = false; try { sessionStorage.removeItem(storageKey); } catch {} }
  function changed() { dirty.current = true; save(); }
  function submit(action: (data: FormData) => void) {
    return (event: FormEvent<HTMLFormElement>) => {
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      if (submitter?.hasAttribute('formaction')) return;
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      changed();
      startTransition(() => action(data));
    };
  }
  return { ref, clear, changed, storageError, submit, hasChanges: () => dirty.current, formProps: {
    ref, onChangeCapture: changed, onInputCapture: changed, onSubmitCapture: changed,
    // React 19 otherwise resets uncontrolled fields even when an action returns an error.
    onReset: (e: FormEvent<HTMLFormElement>) => e.preventDefault(),
  } };
}
