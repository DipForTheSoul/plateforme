import { eventCalendarDaySpan } from './event-time';
import { formatDate, formatTime } from './utils';
import type { Locale } from '@/types/database';

/** Calendar days touched, not elapsed 24-hour periods. */
export function eventInclusiveDays(start: string, end: string): number {
  return Math.max(1, eventCalendarDaySpan(start, end) + 1);
}

/** Each endpoint carries its own date and Swiss local time. */
export function formatEventSchedule(start: string, end: string | null, locale: Locale): string {
  const endpoint = (iso: string) => `${formatDate(iso, locale)} · ${formatTime(iso, locale)}`;
  return end ? `${endpoint(start)} → ${endpoint(end)}` : endpoint(start);
}
