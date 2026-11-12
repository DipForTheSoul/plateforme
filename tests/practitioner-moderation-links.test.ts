import { beforeEach, expect, it, vi } from 'vitest';
import { moderatePractitioner } from '@/app/actions/admin';
const state = vi.hoisted(() => ({ failed: false, email: vi.fn(), tag: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), updateTag: state.tag }));
vi.mock('@/lib/auth', () => ({ getCurrentProfile: async () => ({ role: 'admin' }) }));
vi.mock('@/lib/email', () => ({ sendEmail: state.email }));
vi.mock('@/lib/practitioner-private', () => ({ getPrivateContactEmail: async () => 'qa@example.test' }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: () => ({
  select: () => ({ eq: () => ({ single: async () => ({ data: { id: '2e8a6429-db0e-418c-983c-1c4a9ae71fed', name: 'Emanuelle', slug: 'ancien-lien-tres-long', user_id: 'qa' } }), maybeSingle: async () => ({ data: { preferred_lang: 'fr' } }) }) }),
  update: () => ({ eq: async () => ({ error: state.failed ? {} : null }) }),
}) }) }));
beforeEach(() => { state.failed = false; state.email.mockClear(); state.tag.mockClear(); });
it('envoie la nouvelle adresse dès la validation d’un profil et actualise ses liens publics', async () => {
  const form = new FormData(); form.set('practitioner_id', 'qa'); form.set('decision', 'approved');
  await moderatePractitioner(form);
  expect(state.email.mock.calls[0][0].html).toContain('/praticiens/emanuelle-2e8a6429db0e');
  expect(state.email.mock.calls[0][0].html).not.toContain('ancien-lien-tres-long');
  expect(state.tag).toHaveBeenCalledWith('public-practitioners'); expect(state.tag).toHaveBeenCalledWith('public-events');
});
it('ne notifie ni ne rafraîchit un changement refusé en base', async () => {
  state.failed = true;
  const form = new FormData(); form.set('practitioner_id', 'qa'); form.set('decision', 'approved');
  await expect(moderatePractitioner(form)).rejects.toThrow();
  expect(state.email).not.toHaveBeenCalled(); expect(state.tag).not.toHaveBeenCalled();
});
