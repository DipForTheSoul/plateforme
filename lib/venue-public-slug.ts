import { slugify } from '@/lib/utils';

type Identity = { id: string; name: string; slug?: string | null };
const shortId = (id: string) => {
  const compact = id.replaceAll('-', '').toLowerCase();
  if (compact.length <= 12) return compact;
  // Imported venues can share a long zero-filled UUID prefix.
  return compact.slice(0, 8) + compact.slice(-4);
};

/** Persisted addresses survive name edits; old identifiers remain aliases. */
export function venuePublicSlug(venue: Identity): string {
  return venue.slug || slugify(venue.name).slice(0, 60).replace(/-+$/, '') || 'lieu';
}

export function findPublicVenue<T extends Identity>(venues: T[], address: string): T | null {
  const exact = venues.find(venue => venue.id === address);
  if (exact) return exact;
  const canonical = venues.filter(venue => venuePublicSlug(venue) === address);
  if (canonical.length) return canonical.length === 1 ? canonical[0] : null;
  // The stable suffix preserves a shared address after a name change.
  const id = address.match(/-([a-f0-9]{12})$/i)?.[1]?.toLowerCase();
  const matches = id ? venues.filter(venue => shortId(venue.id) === id) : [];
  return matches.length === 1 ? matches[0] : null;
}
