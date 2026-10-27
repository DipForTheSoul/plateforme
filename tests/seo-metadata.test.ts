import { describe, expect, it, vi } from 'vitest';
import { pageAlternates, SITE_URL } from '@/lib/metadata';
import { eventJsonLd } from '@/lib/seo';
import type { EventWithRelations } from '@/types/database';

vi.mock('next-intl/server', () => ({ getTranslations: async () => (key: string) => key, getLocale: async () => 'fr', setRequestLocale: () => {} }));
vi.mock('@/i18n/navigation', () => ({ Link: () => null }));
vi.mock('@/lib/queries', () => ({
  getEventBySlug: async () => ({ slug: 'danse-soufie', status: 'approved', title: 'Danse', description: 'Texte', images: [] }),
  getPractitionerBySlug: async () => ({ slug: 'cynthia', status: 'approved', name: 'Cynthia', photos: [] }),
  getVenueById: async () => ({ id: 'venue-test', name: 'Lieu', review_status: 'approved', is_public: true }),
}));

describe('public page identity', () => {
  it.each(['fr', 'de', 'en'])('keeps the complete page path in %s', locale => {
    const links = pageAlternates('/experiences/danse-soufie', locale);
    expect(links.canonical).toBe(`${SITE_URL}${locale === 'fr' ? '' : `/${locale}`}/experiences/danse-soufie`);
    expect(links.languages?.fr).toBe(`${SITE_URL}/experiences/danse-soufie`);
    expect(links.languages?.de).toBe(`${SITE_URL}/de/experiences/danse-soufie`);
    expect(links.languages?.en).toBe(`${SITE_URL}/en/experiences/danse-soufie`);
  });
  it('retains the home language links', () => {
    expect(pageAlternates('/', 'fr').canonical).toBe(`${SITE_URL}/`);
    expect(pageAlternates('/', 'de').canonical).toBe(`${SITE_URL}/de`);
  });
  it('event metadata identifies the event rather than the home page', async () => {
    const { generateMetadata } = await import('@/app/[locale]/experiences/[slug]/page');
    const result = await generateMetadata({ params: Promise.resolve({ locale: 'de', slug: 'danse-soufie' }) });
    expect(result.alternates?.canonical).toBe(`${SITE_URL}/de/experiences/danse-soufie`);
  });
  it('practitioner metadata identifies the practitioner', async () => {
    const { generateMetadata } = await import('@/app/[locale]/praticiens/[slug]/page');
    const result = await generateMetadata({ params: Promise.resolve({ locale: 'en', slug: 'cynthia' }) });
    expect(result.alternates?.canonical).toBe(`${SITE_URL}/en/praticiens/cynthia`);
  });
  it('venue metadata identifies the public venue', async () => {
    const { generateMetadata } = await import('@/app/[locale]/lieux/[id]/page');
    const result = await generateMetadata({ params: Promise.resolve({ locale: 'fr', id: 'venue-test' }) });
    expect(result.alternates?.canonical).toBe(`${SITE_URL}/lieux/venue-test`);
  });
});

it('provides the real event locality without changing the date or price', () => {
  const event = { title: 'Danse', slug: 'danse', description: 'Texte', start_date: '2026-11-24T17:00:00Z', images: [], languages: ['fr'], price: 60, price_mode: 'fixed', currency: 'CHF', venue: { name: 'Dôme', address: 'Rue 31', city: 'Neuchâtel', canton: 'NE', country: 'CH', lat: null, lng: null } } as unknown as EventWithRelations;
  const data = eventJsonLd(event);
  expect(data.location?.address).toEqual({ '@type': 'PostalAddress', streetAddress: 'Rue 31', addressLocality: 'Neuchâtel', addressRegion: 'NE', addressCountry: 'CH' });
  expect(data.startDate).toBe(event.start_date);
  expect(data.offers?.price).toBe(60);
});
