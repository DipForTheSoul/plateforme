export const AUDIENCE_CONSENT = 'fts-audience-consent-v2';
export const AUDIENCE_ID = 'fts-audience-browser-v2';
export const AUDIENCE_EVENT = 'fts-audience-consent-changed';
export const AUDIENCE_PREFERENCES = 'fts-audience-preferences';
export function isPublicAudiencePath(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !/^\/(?:fr\/|de\/|en\/)?(?:admin|espace-praticien|connexion|inscription|auth|api|mot-de-passe|reinitialiser)(?:\/|-|$)/.test(path);
}
