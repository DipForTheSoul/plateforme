import { slugify } from '@/lib/utils';

type Identity = { id: string; name: string; slug: string; public_slug?: string | null };

/** Persist the short address separately; stored historical slugs remain aliases. */
export function practitionerPublicSlug(practitioner: Identity): string {
  if (practitioner.public_slug) return practitioner.public_slug;
  const name = slugify(practitioner.name).slice(0, 60).replace(/-+$/, '') || 'praticien';
  return `${name}-${practitioner.id.replaceAll('-', '').slice(0, 12).toLowerCase()}`;
}

export function withPublicPractitionerSlug<T extends Identity>(practitioner: T): T {
  return { ...practitioner, slug: practitionerPublicSlug(practitioner) };
}

export function findPublicPractitioner<T extends Identity>(practitioners: T[], slug: string): T | null {
  const stored = practitioners.find(practitioner => practitioner.id === slug || practitioner.slug === slug);
  if (stored) return stored;
  const canonical = practitioners.filter(practitioner => practitionerPublicSlug(practitioner) === slug);
  if (canonical.length) return canonical.length === 1 ? canonical[0] : null;
  // A previously shared public address also survives a subsequent name edit.
  const id = slug.match(/-([a-f0-9]{12})$/i)?.[1]?.toLowerCase();
  const matches = id ? practitioners.filter(practitioner => practitioner.id.replaceAll('-', '').toLowerCase().startsWith(id)) : [];
  return matches.length === 1 ? matches[0] : null;
}
