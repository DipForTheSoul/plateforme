import type { EventWithRelations } from '@/types/database';

const seriesId = (event: EventWithRelations) => event.parent_event_id ?? event.id;

/** Group after filtering: the selected card must belong to the requested dates. */
export function groupEventSeries(events: EventWithRelations[], allEvents = events, now = Date.now()): EventWithRelations[] {
  const counts = new Map<string, Set<string>>();
  for (const event of allEvents) {
    if (event.status !== 'approved' || Date.parse(event.start_date) < now) continue;
    const key = seriesId(event);
    const dates = counts.get(key) ?? new Set<string>();
    dates.add(event.id); counts.set(key, dates);
  }
  const groups = new Map<string, EventWithRelations[]>();
  for (const event of events) {
    const key = seriesId(event);
    groups.set(key, [...(groups.get(key) ?? []), event]);
  }
  return [...groups.entries()].map(([key, dates]) => {
    const sorted = [...dates].sort((a,b) => Date.parse(a.start_date) - Date.parse(b.start_date) || a.id.localeCompare(b.id));
    const selected = sorted.find(e => Date.parse(e.start_date) >= now) ?? sorted[sorted.length - 1];
    const count = counts.get(key)?.size ?? dates.length;
    return { ...selected, series_date_count: selected.recurrence || selected.parent_event_id || dates.length > 1 ? count : undefined };
  }).sort((a,b) => Number(b.is_top) - Number(a.is_top) || Date.parse(a.start_date) - Date.parse(b.start_date) || a.id.localeCompare(b.id));
}
