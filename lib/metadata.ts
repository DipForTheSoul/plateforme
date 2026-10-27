import type { Metadata } from 'next';

const configuredOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.forthesoul.ch');
// Match the public redirect destination instead of advertising a redirecting URL.
if (configuredOrigin.hostname === 'forthesoul.ch') configuredOrigin.hostname = 'www.forthesoul.ch';
export const SITE_URL = configuredOrigin.origin;

export function pageAlternates(path: string, locale: string): NonNullable<Metadata['alternates']> {
  const suffix = path === '/' ? '' : path;
  const languages = {
    fr: `${SITE_URL}${suffix || '/'}`,
    de: `${SITE_URL}/de${suffix}`,
    en: `${SITE_URL}/en${suffix}`,
    'x-default': `${SITE_URL}${suffix || '/'}`,
  };
  return { canonical: languages[locale as 'fr' | 'de' | 'en'] ?? languages.fr, languages };
}
