"use client";

import {useCallback, useSyncExternalStore} from 'react';
import {useTranslations} from 'next-intl';
import {Link} from '@/i18n/navigation';

function subscribe(notify: () => void) {
  window.addEventListener('storage', notify);
  window.addEventListener('fts:draft-changed', notify);
  window.addEventListener('focus', notify);
  window.addEventListener('pageshow', notify);
  const timer = window.setInterval(notify, 60_000);
  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('fts:draft-changed', notify);
    window.removeEventListener('focus', notify);
    window.removeEventListener('pageshow', notify);
    window.clearInterval(timer);
  };
}

// Return the original string so useSyncExternalStore gets a stable snapshot.
function readDraft(key: string): string | null {
  try {
    const raw = localStorage.getItem(key) ?? sessionStorage.getItem(key);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || !Number.isFinite(draft.at) || draft.at > Date.now()
      || Date.now() - draft.at >= 7 * 86400000
      || !draft.fields || typeof draft.fields !== 'object' || Array.isArray(draft.fields)
      || !draft.extra || typeof draft.extra !== 'object' || Array.isArray(draft.extra)) return null;
    return raw;
  } catch { return null; }
}

export function NewEventDraftCard({owner}: {owner: string}) {
  const t = useTranslations('eventDraftCard');
  // Exactly the same account-scoped key as the new practitioner EventForm.
  const getSnapshot = useCallback(() => readDraft(`fts.draft.v1:event:${owner}:new`), [owner]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);
  if (!raw) return null;
  const fields = JSON.parse(raw).fields;
  const title = Array.isArray(fields.title) && typeof fields.title[0] === 'string'
    ? fields.title[0].trim().slice(0, 300) : '';

  return <section aria-label={t('badge')} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-soul-violet/30 bg-soul-violet/5 p-5">
    <div className="min-w-0 flex-1 basis-56">
      <span className="rounded-full bg-soul-violet/10 px-3 py-1 text-xs font-medium text-soul-violet">{t('badge')}</span>
      <h3 className="mt-2 break-words text-lg text-soul-brown">{title || t('untitled')}</h3>
      <p className="mt-1 text-sm text-soul-bronze">{t('notice')}</p>
    </div>
    <Link href="/espace-praticien/evenements/nouveau" className="btn-primary">{t('resume')}</Link>
  </section>;
}
