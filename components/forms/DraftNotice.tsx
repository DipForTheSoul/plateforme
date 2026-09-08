"use client";
import { useTranslations } from 'next-intl';
import { useEffect, useId, useRef, useState } from 'react';
import type { useDraftForm } from './useDraftForm';

export function DraftNotice({ draft, busy = false, onReload = () => window.location.reload() }: {
  draft: ReturnType<typeof useDraftForm>;
  busy?: boolean;
  onReload?: () => void;
}) {
  const t = useTranslations('draft');
  const [confirmation, setConfirmation] = useState<'discard' | 'reload' | null>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const confirmationId = useId();
  useEffect(() => { if (confirmation) cancel.current?.focus(); }, [confirmation]);
  function dismiss() { setConfirmation(null); trigger.current?.focus(); }
  return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-soul-violet/20 bg-soul-violet/5 p-4 text-sm">
    <p role={draft.conflict || draft.storageError ? 'alert' : 'status'}>
      {t(draft.conflict ? 'conflict' : draft.storageError ? 'unavailable' : draft.hasDraft ? 'saved' : 'ready')}
    </p>
    {draft.conflict ? <button ref={trigger} type="button" className="underline" disabled={busy}
      onClick={() => setConfirmation('reload')}>{t('reload')}</button>
      : draft.hasDraft && <button ref={trigger} type="button" className="underline" disabled={busy}
        onClick={() => setConfirmation('discard')}>{t('discard')}</button>}
    {confirmation && <div role="alertdialog" aria-labelledby={confirmationId} className="basis-full rounded-lg border border-soul-bronze/30 bg-white p-3"
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); dismiss(); } }}>
      <p id={confirmationId}>{t(confirmation === 'discard' ? 'confirmDiscard' : 'confirmReload')}</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button ref={cancel} type="button" className="btn-secondary" disabled={busy} onClick={dismiss}>{t('cancel')}</button>
        <button type="button" className="btn-primary" disabled={busy} onClick={() => {
          if (confirmation === 'reload' || draft.clear()) onReload();
          setConfirmation(null);
        }}>{t('confirm')}</button>
      </div>
    </div>}
  </div>;
}
