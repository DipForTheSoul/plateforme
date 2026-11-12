import { beforeEach, expect, it, vi } from 'vitest';
import PractitionerPage from '@/app/[locale]/praticiens/[slug]/page';
import { permanentRedirect } from 'next/navigation';

const mock = vi.hoisted(() => ({ found: true }));
vi.mock('next/navigation', () => ({ permanentRedirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }), notFound: () => { throw new Error('NOT_FOUND'); } }));
vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key, setRequestLocale: () => {} }));
vi.mock('@/i18n/navigation', () => ({ Link: () => null }));
vi.mock('@/lib/queries', () => ({ getPractitionerBySlug: async () => mock.found ? { id: 'p', name: 'Cynthia', slug: 'cynthia-0aa5de4e6e0a', status: 'approved' } : null, getApprovedEvents: vi.fn() }));
beforeEach(() => { mock.found = true; vi.mocked(permanentRedirect).mockClear(); });
it.each([['fr', '/praticiens/'], ['de', '/de/anbieter/'], ['en', '/en/practitioners/']])('redirige l’ancien lien vers la bonne adresse en %s', async (locale, prefix) => {
  await expect(PractitionerPage({ params: Promise.resolve({ locale, slug: 'fadoua-1cfe0e' }) })).rejects.toThrow('NEXT_REDIRECT');
  expect(permanentRedirect).toHaveBeenCalledWith(`${prefix}cynthia-0aa5de4e6e0a`);
});
it('ne redirige pas une identité inconnue vers un autre profil', async () => {
  mock.found = false;
  await expect(PractitionerPage({ params: Promise.resolve({ locale: 'fr', slug: 'inconnu' }) })).rejects.toThrow('NOT_FOUND');
  expect(permanentRedirect).not.toHaveBeenCalled();
});
it('conserve les repères de campagne et encode les valeurs lors de la redirection', async () => {
  await expect(PractitionerPage({ params: Promise.resolve({ locale: 'fr', slug: 'fadoua-1cfe0e' }), searchParams: Promise.resolve({ utm_source: 'facebook', utm_campaign: ['été', 'local'] }) })).rejects.toThrow('NEXT_REDIRECT');
  expect(permanentRedirect).toHaveBeenCalledWith('/praticiens/cynthia-0aa5de4e6e0a?utm_source=facebook&utm_campaign=%C3%A9t%C3%A9&utm_campaign=local');
});
