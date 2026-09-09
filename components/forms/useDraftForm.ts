"use client";
import { startTransition, useEffect, useRef, useState, type FormEvent } from 'react';

type Draft = { at: number; fields: Record<string, string[]>; extra: Record<string, unknown> };
const EMPTY = {};

/** Persistent storage is opt-in and requires an account/object-scoped key. */
export function useDraftForm(key: string, extra: Record<string, unknown> = EMPTY, restoreExtra?: (data: Record<string, unknown>, fields: Record<string, string[]>) => void, options: { persistent?: boolean; updatedAt?: string } = {}) {
  const ref = useRef<HTMLFormElement>(null);
  const latest = useRef({ extra, restoreExtra });
  useEffect(() => { latest.current = { extra, restoreExtra }; });
  const [storageError, setStorageError] = useState(false);
  const [conflict, setConflict] = useState(false);
  const conflictRef = useRef(false);
  const [hasDraft, setHasDraft] = useState(false);
  const lastStored = useRef<string | null>(null);
  const restored = useRef(false);
  const dirty = useRef(false);
  const storageKey = `fts.draft.v1:${key}`;
  const persistent = options.persistent === true;
  const storage = () => persistent ? localStorage : sessionStorage;
  function markConflict() { conflictRef.current = true; setConflict(true); }

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
    try {
      if (persistent && storage().getItem(storageKey) !== lastStored.current) { markConflict(); return; }
      const savedExtra = { ...latest.current.extra, ...(options.updatedAt ? { updatedAt: options.updatedAt } : {}) };
      // Merely reopening a draft must not renew its age or invalidate another tab.
      if (lastStored.current) {
        try {
          const previous: Draft = JSON.parse(lastStored.current);
          if (JSON.stringify(previous.fields) === JSON.stringify(fields) && JSON.stringify(previous.extra) === JSON.stringify(savedExtra)) return;
        } catch { /* Replace malformed local data with this valid snapshot. */ }
      }
      const raw = JSON.stringify({ at: Date.now(), fields, extra: savedExtra });
      storage().setItem(storageKey, raw);
      lastStored.current = raw;
      window.dispatchEvent(new Event('fts:draft-changed'));
      setHasDraft(true);
      setStorageError(false);
    }
    catch { setStorageError(true); }
  }

  useEffect(() => {
    restored.current = false;
    try {
      lastStored.current = storage().getItem(storageKey);
      const raw = storage().getItem(storageKey) ?? (persistent ? sessionStorage.getItem(storageKey) : null);
      if (raw) {
        const draft: Draft = JSON.parse(raw);
        if (Number.isFinite(draft.at) && draft.at <= Date.now() && Date.now() - draft.at < 7 * 86400000 && draft.fields && draft.extra) {
          latest.current.restoreExtra?.(draft.extra, draft.fields);
          for (const element of Array.from(ref.current?.elements ?? [])) {
            if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) continue;
            const values = draft.fields[element.name];
            if (!Array.isArray(values) || !values.every(v => typeof v === 'string') || ['password', 'file', 'hidden'].includes(element.type)) continue;
            if (element instanceof HTMLInputElement && ['checkbox', 'radio'].includes(element.type)) element.checked = values.includes(element.value);
            else {
              element.value = values[0] ?? '';
              // Rich editors keep a visible contenteditable surface synchronized with
              // their native form field. Notify only those fields after draft restore.
              if (element instanceof HTMLTextAreaElement && element.dataset.richEditorBacking === 'true') {
                element.dispatchEvent(new Event('input', { bubbles: true }));
              }
            }
          }
          dirty.current = true;
          // Hydrate status from external browser storage, unavailable during SSR.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setHasDraft(true);
          if (persistent && lastStored.current === null) {
            storage().setItem(storageKey, raw);
            lastStored.current = raw;
            sessionStorage.removeItem(storageKey);
          }
        }
      }
    } catch {
      // Hydrate the browser storage failure; never prevent editing the form.
      setStorageError(true);
    }
    restored.current = true;
  // Storage selection is fixed for the lifetime of a form.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, persistent]);

  useEffect(() => {
    if (!persistent) return;
    const changedElsewhere = (event: StorageEvent) => {
      if ((event.key === storageKey || event.key === null) && event.storageArea === localStorage && event.newValue !== lastStored.current) markConflict();
    };
    window.addEventListener('storage', changedElsewhere);
    return () => window.removeEventListener('storage', changedElsewhere);
  }, [persistent, storageKey]);

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

  function clear(savedExtra?: Record<string, unknown>) {
    try {
      if (persistent && storage().getItem(storageKey) !== lastStored.current) { markConflict(); return false; }
      storage().removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
      lastStored.current = null;
      window.dispatchEvent(new Event('fts:draft-changed'));
      dirty.current = false;
      // A confirmed server operation may also update controlled form state.
      // Its next render is a saved baseline, not a fresh user draft.
      if (savedExtra) previousExtra.current = JSON.stringify(savedExtra);
      setHasDraft(false);
      return true;
    } catch { setStorageError(true); return false; }
  }
  function changed() { dirty.current = true; save(); }
  function submit(action: (data: FormData) => void) {
    return (event: FormEvent<HTMLFormElement>) => {
      const submitter = (event.nativeEvent as SubmitEvent).submitter;
      if (submitter?.hasAttribute('formaction')) return;
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      changed();
      if (conflictRef.current) return;
      startTransition(() => action(data));
    };
  }
  return { ref, clear, changed, storageError, conflict, hasDraft, persistent, submit, hasChanges: () => dirty.current, formProps: {
    ref, onChangeCapture: changed, onInputCapture: changed, onSubmitCapture: changed,
    // React 19 otherwise resets uncontrolled fields even when an action returns an error.
    onReset: (e: FormEvent<HTMLFormElement>) => e.preventDefault(),
  } };
}
