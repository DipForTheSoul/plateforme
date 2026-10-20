import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('next-intl/server', () => ({ getLocale: async () => 'fr', setRequestLocale: () => {}, getTranslations: async () => () => '' }));
vi.mock('@/lib/queries', () => ({ getEventBySlug: async () => ({ id: 'fixture', status: 'approved' }), getAdjacentEvents: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ rpc: state.rpc, from: () => { throw new Error('COUNTER_CHECK_COMPLETE'); } }) }));
vi.mock('@/i18n/navigation', () => ({ Link: () => null }));
import EventPage from '@/app/[locale]/experiences/[slug]/page';
beforeEach(() => { vi.clearAllMocks(); state.rpc.mockResolvedValue({ error: null }); });
afterEach(() => vi.unstubAllEnvs());
it('ne modifie pas le compteur distant pendant une consultation de preview', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  await expect(EventPage({ params: Promise.resolve({ locale: 'fr', slug: 'fixture' }) })).rejects.toThrow('COUNTER_CHECK_COMPLETE');
  expect(state.rpc).not.toHaveBeenCalled();
});
it('ne change pas le caller actuellement utilisé en production', async () => {
  vi.stubEnv('VERCEL_ENV', 'production');
  await expect(EventPage({ params: Promise.resolve({ locale: 'fr', slug: 'fixture' }) })).rejects.toThrow('COUNTER_CHECK_COMPLETE');
  expect(state.rpc).toHaveBeenCalledExactlyOnceWith('increment_event_view', { p_event_id: 'fixture' });
});
