import { render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { FavoritesClient } from '@/app/[locale]/favoris/FavoritesClient';

vi.mock('next-intl', () => ({ useLocale: () => 'fr' }));
vi.mock('@/i18n/navigation', () => ({ Link: ({ href, children }: { href: { pathname: string; params: { slug: string } }; children: ReactNode }) => <a href={href.pathname.replace('[slug]', href.params.slug)}>{children}</a> }));
vi.mock('@/components/FavoriteButton', () => ({ FavoriteButton: () => null }));
vi.mock('@/lib/favorites', () => ({ getFavoriteEventIds: () => [], getFavoritePractitionerIds: () => ['2e8a6429-db0e-418c-983c-1c4a9ae71fed'], favoritesAreTemporary: () => false }));
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ from: () => ({ select: () => ({ in: () => ({ eq: async () => ({ error: null, data: [{ id: '2e8a6429-db0e-418c-983c-1c4a9ae71fed', name: 'Emanuelle', slug: 'ancien-lien-beaucoup-trop-long', photos: [], specialties: [], languages: ['fr'] }] }) }) }) }) }) }));

it('affiche directement le nouveau lien dans les favoris chargés par le navigateur', async () => {
  render(<FavoritesClient labels={{ events: 'Expériences', practitioners: 'Praticiens', empty: 'Aucun favori' }} />);
  expect(await screen.findByRole('link', { name: 'Emanuelle' })).toHaveAttribute('href', '/praticiens/emanuelle-2e8a6429db0e');
});
