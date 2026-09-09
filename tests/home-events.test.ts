import { expect, it } from 'vitest';
import { nextHomeExperiences } from '@/lib/home-events';
import type { EventWithRelations } from '@/types/database';

const now = Date.parse('2026-09-09T12:00:00Z');
function event(id: string, start: string, parent: string | null = null, overrides = {}): EventWithRelations {
  return { id, title: 'Même titre', start_date: start, parent_event_id: parent, status: 'approved', is_top: false, ...overrides } as EventWithRelations;
}
const root = event('root', '2026-09-10T14:08:00Z');
const second = event('second', '2026-09-17T14:08:00Z', 'root');
const third = event('third', '2026-09-24T14:08:00Z', 'root');

it('affiche une seule carte par série triée avec les expériences indépendantes', () => {
  const other = event('other', '2026-09-11T09:00:00Z');
  expect(nextHomeExperiences([third, other, second, root], now).map(e => e.id)).toEqual(['root', 'other']);
});
it('passe à la prochaine occurrence quand la première date est passée', () => {
  expect(nextHomeExperiences([root, third, second], Date.parse('2026-09-11T00:00:00Z'))).toEqual([{ ...second, series_date_count: 2 }]);
});
it('garde la prochaine date si la racine est absente, supprimée ou dépubliée', () => {
  expect(nextHomeExperiences([third, second], now)).toEqual([{ ...second, series_date_count: 2 }]);
  expect(nextHomeExperiences([{ ...root, status: 'rejected' }, third, second], now)).toEqual([{ ...second, series_date_count: 2 }]);
});
it('ne confond pas deux expériences de même titre et limite après regroupement', () => {
  const standalone = Array.from({ length: 9 }, (_,i) => event(`other-${i}`, '2026-09-25T10:00:00Z'));
  const result = nextHomeExperiences([root, second, third, ...standalone], now);
  expect(result).toHaveLength(8);
  expect(result.map(e => e.id)).toEqual(['root', ...standalone.slice(0,7).map(e => e.id)]);
});
it('exclut dates passées, invalides, non approuvées et mises en avant sans modifier le catalogue', () => {
  const rows = [event('past', '2026-09-01T09:00:00Z'), event('bad', 'invalid'), { ...root, is_top: true }, { ...second, status: 'pending' as const }, third];
  const before = structuredClone(rows);
  expect(nextHomeExperiences(rows, now)).toEqual([{ ...third, series_date_count: 2 }]);
  expect(rows).toEqual(before);
});
