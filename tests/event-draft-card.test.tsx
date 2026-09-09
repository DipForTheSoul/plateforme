import {act, fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {NextIntlClientProvider} from 'next-intl';
import {NewEventDraftCard} from '@/components/forms/NewEventDraftCard';
import {useDraftForm} from '@/components/forms/useDraftForm';
import fr from '@/messages/fr.json';

vi.mock('@/i18n/navigation', () => ({Link: ({href, children}: {href: string; children: React.ReactNode}) => <a href={href}>{children}</a>}));
const key = 'fts.draft.v1:event:alice:new';
const saved = (title = 'Mon atelier', at = Date.now()) => JSON.stringify({at, fields: {title: [title]}, extra: {}});
const wrap = (owner = 'alice') => <NextIntlClientProvider locale="fr" messages={fr}><NewEventDraftCard owner={owner}/></NextIntlClientProvider>;

describe('brouillon dans Mes expériences', () => {
  it('affiche le titre et un lien vers le formulaire existant sans modifier le brouillon', () => {
    const raw = saved();
    localStorage.setItem(key, raw);
    render(wrap());
    expect(screen.getByRole('region', {name: 'Brouillon'})).toBeInTheDocument();
    expect(screen.getByText('Mon atelier')).toBeInTheDocument();
    expect(screen.getByRole('link', {name: 'Reprendre'})).toHaveAttribute('href', '/espace-praticien/evenements/nouveau');
    expect(localStorage.getItem(key)).toBe(raw);
  });

  it('ne révèle pas les brouillons des autres comptes, des éditions ou de l’admin', () => {
    localStorage.setItem(key, saved());
    localStorage.setItem('fts.draft.v1:event:bob:admin-new', saved('Admin'));
    localStorage.setItem('fts.draft.v1:event:bob:event-id', saved('Modification'));
    const view = render(wrap());
    view.rerender(wrap('bob'));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it.each(['{cassé', 'null', saved('Expiré', Date.now() - 7 * 86400000), saved('Futur', Date.now() + 86400000)])('ignore un brouillon invalide ou expiré : %s', raw => {
    localStorage.setItem(key, raw);
    render(wrap());
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('accepte un brouillon sans titre et le stockage de session historique', () => {
    sessionStorage.setItem(key, saved(''));
    render(wrap());
    expect(screen.getByText('Expérience sans titre')).toBeInTheDocument();
  });

  it('actualise la carte après modification ou suppression dans un autre onglet', () => {
    render(wrap());
    act(() => {localStorage.setItem(key, saved()); window.dispatchEvent(new StorageEvent('storage', {key}));});
    expect(screen.getByText('Mon atelier')).toBeInTheDocument();
    act(() => {localStorage.removeItem(key); window.dispatchEvent(new StorageEvent('storage', {key}));});
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('disparaît après la suppression confirmée par le formulaire, dans le même onglet', () => {
    function Form() {
      const draft = useDraftForm('event:alice:new', {}, undefined, {persistent: true});
      return <form {...draft.formProps}><input name="title" aria-label="Titre"/><button type="button" onClick={() => draft.clear()}>Terminé</button></form>;
    }
    render(<>{wrap()}<Form/></>);
    fireEvent.change(screen.getByLabelText('Titre'), {target: {value: 'Mon nouveau brouillon'}});
    expect(screen.getByText('Mon nouveau brouillon')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', {name: 'Terminé'}));
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});
