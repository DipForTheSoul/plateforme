import type { EventWithRelations } from '@/types/database';
import { groupEventSeries } from './event-series';

/** Home teaser only: keep the next upcoming occurrence of each series. */
export function nextHomeExperiences(
  events: EventWithRelations[],
  now = Date.now(),
  limit = 8,
): EventWithRelations[] {
  const upcoming = events
    .filter((event) => event.status === 'approved' && !event.is_top && Date.parse(event.start_date) >= now)
    .sort((a, b) => Date.parse(a.start_date) - Date.parse(b.start_date) || a.id.localeCompare(b.id));
  return groupEventSeries(upcoming, events, now).slice(0, limit);
}
