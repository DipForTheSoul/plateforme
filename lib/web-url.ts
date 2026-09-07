import { z } from 'zod';

/** Human-entered web addresses only: never allow script/data/file URLs. */
export function normalizeWebUrl(value: unknown): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(text) ? text : `https://${text.replace(/^\/\//, '')}`;
  try {
    const url = new URL(candidate);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || /\s/.test(text) || !url.hostname.includes('.')) return text;
    return url.href;
  } catch { return text; }
}

export const webUrlSchema = z.preprocess(normalizeWebUrl, z.string().url().refine(value => {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password && url.hostname.includes('.');
  } catch { return false; }
}, 'Adresse web invalide.').nullable());
