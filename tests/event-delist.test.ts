import { beforeEach, expect, it, vi } from 'vitest';
import { getApprovedEvents, getEventBySlug } from '@/lib/queries';

const state = vi.hoisted(() => ({ days: '10' as string | null, failed: false, reads: [] as string[] }));
const events = [
  { id: 'old', slug: 'love-lounge', title: 'Love Lounge', start_date: '2026-10-30T18:00:00.000Z', end_date: null },
  { id: 'boundary', slug: 'boundary', title: 'Limite', start_date: '2026-11-01T12:00:00.000Z', end_date: null },
  { id: 'expired', slug: 'expired', title: 'Expiré', start_date: '2026-11-01T11:59:59.000Z', end_date: null },
  { id: 'stay', slug: 'stay', title: 'Séjour', start_date: '2026-10-28T12:00:00.000Z', end_date: '2026-11-05T12:00:00.000Z' },
  { id: 'future', slug: 'future', title: 'Prochaine occurrence', start_date: '2026-11-20T12:00:00.000Z', end_date: null, parent_event_id: 'old' },
];
vi.mock('@/lib/supabase/public', () => ({ createPublicClient: () => ({ from: (table: string) => {
  const query = {
    select: () => query, eq: () => query, order: () => query, range: () => query,
    // RLS hides event_delist_days from anonymous clients in the real database.
    then: (resolve: (value: unknown) => unknown) => resolve({ error: null, data: table === 'settings' ? [] : events.map(event => ({ ...event, status: 'approved', event_categories: [], languages: ['fr'] })) }),
  };
  return query;
} }) }));
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: (table: string) => ({ select: (columns: string) => ({ eq: (key: string, value: string) => {
  state.reads.push(`${table}:${columns}:${key}=${value}`);
  return { maybeSingle: async () => ({ data: state.days === null ? null : { value: state.days }, error: state.failed ? { message: 'unavailable' } : null }) };
} }) }) }) }));

beforeEach(() => {
  state.days = '10'; state.failed = false; state.reads = [];
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-11T12:00:00.000Z'));
});

it('applique les 10 jours enregistrés même lorsque le réglage est caché au public', async () => {
  expect((await getApprovedEvents()).map(event => event.id)).toEqual(['boundary', 'stay', 'future']);
  expect(state.reads).toEqual(['settings:value:key=event_delist_days']);
});
it('conserve la fiche approuvée accessible après le retrait des listes', async () => {
  expect((await getEventBySlug('love-lounge'))?.id).toBe('old');
});
it('reprend la durée modifiée par l’administrateur et accepte zéro jour', async () => {
  state.days = '15';
  expect((await getApprovedEvents()).map(event => event.id)).toContain('old');
  state.days = '0';
  expect((await getApprovedEvents()).map(event => event.id)).toEqual(['future']);
});
it('utilise les 15 jours par défaut uniquement si le réglage n’existe pas', async () => {
  state.days = null;
  expect((await getApprovedEvents()).map(event => event.id)).toContain('old');
});
it.each(['', '-1', 'NaN', '2.5', '36501'])('signale le réglage invalide %j au lieu de prolonger silencieusement la publication', async days => {
  state.days = days;
  await expect(getApprovedEvents()).rejects.toThrow('Le catalogue est momentanément indisponible');
});
it('signale une panne de lecture du délai au lieu d’utiliser silencieusement 15 jours', async () => {
  state.failed = true;
  await expect(getApprovedEvents()).rejects.toThrow('Le catalogue est momentanément indisponible');
});
