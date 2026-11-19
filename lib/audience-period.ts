/** Calendar months only; unrecognised URL input leaves the default rolling view. */
export function audienceMonth(value?: string | string[]): string | undefined {
  return typeof value === 'string' && /^20\d{2}-(0[1-9]|1[0-2])$/.test(value) ? value : undefined;
}

export function audienceMonths(startedAt: string, end: string): string[] {
  const start = new Date(startedAt).toLocaleDateString('en-CA', {timeZone: 'Europe/Zurich', year: 'numeric', month: '2-digit'});
  const first = start.slice(0, 7);
  const last = end.slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(first) || first > last) return [];
  const result: string[] = [];
  let month = last;
  while (month >= first && result.length < 1200) {
    result.push(month);
    const date = new Date(month + '-01T12:00:00Z');
    date.setUTCMonth(date.getUTCMonth() - 1);
    month = date.toISOString().slice(0, 7);
  }
  return result;
}
