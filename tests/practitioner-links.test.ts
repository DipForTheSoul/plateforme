import { beforeEach, expect, it, vi } from 'vitest';
import { getApprovedPractitioners, getPractitionerBySlug, getPractitionersByIds, getApprovedEvents, getEventsByIds } from '@/lib/queries';
import sitemap from '@/app/sitemap';

const state = vi.hoisted(() => ({
  name: 'Emanuelle Ging - Emanessence',
  id: '2e8a6429-db0e-418c-983c-1c4a9ae71fed',
  legacy: 'emanessence-soins-energetiques-b4f45e5a-83f4-42d0-8c5b-cc2e09476927',
}));
const canonical = 'emanuelle-ging-emanessence-2e8a6429db0e';
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { value: '10' }, error: null }) }) }) }) }) }));
vi.mock('@/lib/supabase/public', () => ({ createPublicClient: () => ({ from: (table: string) => {
  const p = { id: state.id, name: state.name, slug: state.legacy, status: 'approved', updated_at: '2026-11-01' };
  const query = {
    select: () => query, eq: () => query, order: () => query, range: () => query,
    then: (resolve: (value: unknown) => unknown) => resolve({ error: null, data: table === 'practitioners' ? [p] : table === 'events' ? [{ id: 'event', slug: 'danse', title: 'Danse', start_date: '2030-11-20T10:00:00Z', end_date: null, status: 'approved', languages: ['fr'], practitioner: p, event_categories: [] }] : [] }),
  };
  return query;
} }) }));

beforeEach(() => { state.name = 'Emanuelle Ging - Emanessence'; });
it('utilise la même adresse courte dans l’annuaire et les favoris', async () => {
  expect((await getApprovedPractitioners())[0].slug).toBe(canonical);
  expect((await getPractitionersByIds([state.id]))[0].slug).toBe(canonical);
});
it('résout les anciennes et nouvelles adresses vers le même profil', async () => {
  expect((await getPractitionerBySlug(state.legacy))?.id).toBe(state.id);
  expect((await getPractitionerBySlug(canonical))?.id).toBe(state.id);
  expect((await getPractitionerBySlug(state.legacy))?.slug).toBe(canonical);
});
it('préserve un lien déjà partagé après modification du nom', async () => {
  state.name = 'Nouveau nom';
  expect((await getPractitionerBySlug(canonical))?.slug).toBe('nouveau-nom-2e8a6429db0e');
});
it('utilise les adresses courtes dans les liens des expériences', async () => {
  expect((await getEventsByIds(['event']))[0].practitioner?.slug).toBe(canonical);
});
it('retrouve les expériences avec un filtre de praticien ancien ou nouveau', async () => {
  expect((await getApprovedEvents({ practitioner: canonical })).map(event => event.id)).toEqual(['event']);
  expect((await getApprovedEvents({ practitioner: state.legacy })).map(event => event.id)).toEqual(['event']);
  expect(await getApprovedEvents({ practitioner: 'inconnu' })).toEqual([]);
});
it('publie uniquement les nouvelles adresses et leurs langues dans le sitemap', async () => {
  const entry = (await sitemap()).find(entry => entry.url.includes('/praticiens/'))!;
  expect(entry.url).toMatch(new RegExp(`/praticiens/${canonical}$`));
  expect(entry.alternates?.languages?.de).toMatch(new RegExp(`/de/anbieter/${canonical}$`));
});
