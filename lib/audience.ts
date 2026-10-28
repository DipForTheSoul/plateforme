export const AUDIENCE_CONSENT = 'fts-audience-consent-v2';
export const AUDIENCE_ID = 'fts-audience-browser-v2';
export const AUDIENCE_EVENT = 'fts-audience-consent-changed';
export const AUDIENCE_PREFERENCES = 'fts-audience-preferences';
// Keep the legacy Google key and browser ID: changing either would lose choices
// or count returning browsers twice. Internal measurement has its own choice.
export const INTERNAL_AUDIENCE = 'fts-internal-audience-v3';
export type InternalAudienceChoice = 'enabled' | 'disabled';
export function internalAudienceChoice(value: string | null | undefined, legacy: string | null | undefined): InternalAudienceChoice {
  if (value === 'disabled' || value === 'enabled') return value;
  return legacy === 'refused' ? 'disabled' : 'enabled';
}
export function isPublicAudiencePath(path: string) {
  return path.startsWith('/') && !path.startsWith('//') && !/^\/(?:fr\/|de\/|en\/)?(?:admin|espace-praticien|connexion|auth|api|apercu|recette-mobile|mot-de-passe|reinitialiser)(?:\/|-|$)/.test(path);
}
