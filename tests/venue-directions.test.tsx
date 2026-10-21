import {beforeEach, expect, it, vi} from 'vitest';
import {render, screen, cleanup} from '@testing-library/react';
import type {ComponentProps} from 'react';
import VenuePage from '@/app/[locale]/lieux/[id]/page';

const state = vi.hoisted(() => ({lat: 46 as number | null, lng: 6 as number | null}));
vi.mock('next-intl/server', () => ({setRequestLocale: vi.fn(), getTranslations: async () => (key: string) => key}));
vi.mock('@/i18n/navigation', () => ({Link: (props: ComponentProps<'a'>) => <a {...props} />}));
vi.mock('@/components/VenueMap', () => ({VenueMap: () => <div data-testid="venue-map">Carte</div>}));
vi.mock('@/lib/queries', () => ({getVenueById: async () => ({
  id: 'venue-test', name: 'Lieu test', address: 'Place de la Gare 1', city: 'Lausanne',
  country: 'CH', review_status: 'approved', is_public: true, lat: state.lat, lng: state.lng,
  contact: {},
})}));
vi.mock('@/lib/supabase/server', () => ({createClient: async () => ({from: () => ({select: () => ({
  eq: () => ({eq: () => ({gte: () => ({order: async () => ({data: []})})})}),
})})})}));

beforeEach(() => {cleanup(); state.lat = 46; state.lng = 6;});

it('place l’itinéraire après la carte et conserve son adresse de destination', async () => {
  render(await VenuePage({params: Promise.resolve({locale: 'fr', id: 'venue-test'})}));
  const directions = screen.getByRole('link', {name: 'directions'});
  const map = screen.getByTestId('venue-map');
  expect(map.compareDocumentPosition(directions) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(directions.getAttribute('href')).toContain('destination=Place%20de%20la%20Gare%201');
  expect(screen.getByRole('link', {name: /openInOsm/})).toBeInTheDocument();
});

it('conserve le lien itinéraire quand le lieu n’a pas de coordonnées', async () => {
  state.lat = null; state.lng = null;
  render(await VenuePage({params: Promise.resolve({locale: 'fr', id: 'venue-test'})}));
  expect(screen.queryByTestId('venue-map')).not.toBeInTheDocument();
  expect(screen.getByRole('link', {name: 'directions'})).toBeInTheDocument();
});
