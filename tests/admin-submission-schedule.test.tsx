import { beforeEach, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator } from 'next-intl';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import SubmissionsPage from '@/app/[locale]/admin/soumissions/page';
import AdminEditEventPage from '@/app/[locale]/admin/soumissions/[id]/page';

const state = vi.hoisted(() => ({ locale: 'fr' as 'fr' | 'de' | 'en', end: '2026-09-13T14:00:00Z' as string | null, status: 'pending' }));
vi.mock('next-intl/server', () => ({
  getLocale: async () => state.locale,
  getTranslations: async () => createTranslator({ locale: state.locale, messages: { fr, de, en }[state.locale], namespace: 'admin.submissions' }),
}));
vi.mock('@/components/StatusBadge', () => ({ StatusBadge: () => null }));
vi.mock('@/components/forms/EventForm', () => ({ EventForm: () => <form data-testid="event-form" /> }));
vi.mock('@/i18n/navigation', () => ({ Link: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a> }));
vi.mock('@/app/actions/admin', () => ({ moderateEvent: () => {} }));
vi.mock('@/app/actions/events', () => ({ adminUpdateEvent: () => {} }));
vi.mock('@/lib/auth', () => ({ requireRole: async () => ({ id: 'admin-qa' }) }));
vi.mock('@/lib/queries', () => ({ getCategories: async () => [], getVenues: async () => [] }));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: () => {
  const event = { id: 'event-qa', title: 'Séjour QA', start_date: '2026-09-11T09:00:00Z', end_date: state.end, status: state.status, languages: ['fr'] };
  const q = { select: () => q, is: () => q, eq: () => q, order: () => q, range: () => q,
    maybeSingle: async () => ({ data: event }),
    then: (resolve: (value: unknown) => unknown) => resolve({ data: [event], error: null }),
  };
  return q;
} }) }));
beforeEach(() => { state.locale = 'fr'; state.end = '2026-09-13T14:00:00Z'; state.status = 'pending'; });

it.each(['pending', 'approved'])('affiche le début, la fin et les 3 jours dans la carte %s', async (status) => {
  state.status = status;
  const html = renderToStaticMarkup(await SubmissionsPage());
  expect(html).toContain('Vendredi 11.09.2026 · 11:00 → Dimanche 13.09.2026 · 16:00');
  expect(html).toContain('3 jours');
});
it.each([['de', '3 Tage'], ['en', '3 days']] as const)('traduit la durée en %s', async (locale, duration) => {
  state.locale = locale;
  expect(renderToStaticMarkup(await SubmissionsPage())).toContain(duration);
});
it('ne crée pas de fin ni de durée en jours pour une expérience sans date de fin', async () => {
  state.end = null;
  const html = renderToStaticMarkup(await SubmissionsPage());
  expect(html).toContain('Vendredi 11.09.2026 · 11:00');
  expect(html).not.toContain('→');
  expect(html).not.toContain('jours');
});
it('offre un retour aux soumissions avant et après le formulaire sans soumettre', async () => {
  const html = renderToStaticMarkup(await AdminEditEventPage({ params: Promise.resolve({ id: 'event-qa' }) }));
  expect(html.match(/href="\/admin\/soumissions"/g)).toHaveLength(2);
  expect(html.indexOf('Retour aux soumissions')).toBeLessThan(html.indexOf('<form'));
  expect(html.lastIndexOf('Retour aux soumissions')).toBeGreaterThan(html.indexOf('</form>'));
});
