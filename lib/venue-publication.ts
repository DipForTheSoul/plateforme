import type { Venue } from '@/types/database';

/** Undefined only covers legacy snapshots while the additive migration rolls out. */
export function isVenuePublished(venue: Pick<Venue, 'review_status' | 'is_public'>) {
  return venue.review_status !== 'pending' && venue.is_public !== false;
}
