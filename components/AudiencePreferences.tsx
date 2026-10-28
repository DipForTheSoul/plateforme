"use client";
import { useLocale } from 'next-intl';
import { AUDIENCE_PREFERENCES } from '@/lib/audience';

export function AudiencePreferences() {
  const locale=useLocale();
  return <button type="button" className="min-h-11 text-left hover:text-soul-violet" onClick={()=>window.dispatchEvent(new Event(AUDIENCE_PREFERENCES))}>
    {locale==='de'?'Datenschutzeinstellungen':locale==='en'?'Privacy preferences':'Préférences de confidentialité'}
  </button>;
}
