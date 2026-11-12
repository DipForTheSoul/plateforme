import { expect, it } from 'vitest';
import { findPublicPractitioner, practitionerPublicSlug } from '@/lib/practitioner-public-slug';

const profile = { id: '0aa5de4e-6e0a-41f6-a063-3c7453d729a7', name: 'Cynthia', slug: 'fadoua-1cfe0e' };
it('uniformise aussi une ancienne adresse courte portant un autre nom', () => {
  expect(practitionerPublicSlug(profile)).toBe('cynthia-0aa5de4e6e0a');
  expect(findPublicPractitioner([profile], 'fadoua-1cfe0e')).toBe(profile);
});
it('borne la longueur et normalise accents et caractères spéciaux', () => {
  const slug = practitionerPublicSlug({ ...profile, name: 'Énergie & Corps / '.repeat(12) });
  expect(slug.length).toBeLessThanOrEqual(73);
  expect(slug).toMatch(/^energie-et-corps|^energie-corps/);
  expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  expect(practitionerPublicSlug({ ...profile, name: '🌸' })).toBe('praticien-0aa5de4e6e0a');
});
it('distingue deux homonymes sans utiliser un ancien suffixe basé sur le compte', () => {
  const other = { ...profile, id: '2e8a6429-db0e-418c-983c-1c4a9ae71fed', slug: 'cynthia-autre' };
  expect(practitionerPublicSlug(profile)).not.toBe(practitionerPublicSlug(other));
  expect(findPublicPractitioner([profile, other], practitionerPublicSlug(other))).toBe(other);
});
it('refuse les identités absentes ou ambiguës plutôt que d’ouvrir un autre profil', () => {
  const other = { ...profile, id: '0aa5de4e-6e0a-41f6-b000-000000000000', slug: 'autre' };
  expect(findPublicPractitioner([profile], 'inconnu-ffffffffffff')).toBeNull();
  expect(findPublicPractitioner([profile, other], 'ancien-nom-0aa5de4e6e0a')).toBeNull();
  expect(findPublicPractitioner([profile, other], practitionerPublicSlug(profile))).toBeNull();
});
