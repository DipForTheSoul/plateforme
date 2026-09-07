export const EVENT_TIME_ZONE = 'Europe/Zurich';

/** Difference between Swiss calendar dates, without server-timezone or DST drift. */
export function eventCalendarDaySpan(start: string, end: string): number {
  const day = (value: string) => Date.parse(`${toEventLocalInput(value).slice(0, 10)}T00:00:00Z`);
  return Math.round((day(end) - day(start)) / 86_400_000);
}

export function toEventLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: EVENT_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const p = (type: Intl.DateTimeFormatPartTypes) => parts.find(x => x.type === type)?.value;
  return `${p('year')}-${p('month')}-${p('day')}T${p('hour')}:${p('minute')}`;
}

/** Round-trip validation rejects malformed dates and nonexistent spring DST times. */
export function eventLocalToIso(local: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) throw new Error('Date ou heure invalide.');
  const nominal = Date.parse(`${local}:00Z`);
  if (!Number.isFinite(nominal)) throw new Error('Date ou heure invalide.');
  // Zurich uses UTC+1 or UTC+2. Autumn ambiguity is consistently the first occurrence.
  for (const offset of [2, 1]) {
    const iso = new Date(nominal - offset * 3600000).toISOString();
    if (toEventLocalInput(iso) === local) return iso;
  }
  throw new Error('Cette heure n’existe pas en Suisse (changement d’heure).');
}

export function shiftEventDate(iso: string, recurrence: 'weekly' | 'biweekly' | 'monthly', step: number): string {
  const local = toEventLocalInput(iso);
  const d = new Date(`${local}:00Z`);
  if (recurrence === 'monthly') {
    const day = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + step);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last));
  } else d.setUTCDate(d.getUTCDate() + (recurrence === 'weekly' ? 7 : 14) * step);
  return eventLocalToIso(d.toISOString().slice(0, 16));
}
