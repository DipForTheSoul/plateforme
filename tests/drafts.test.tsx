import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import fr from '@/messages/fr.json';
import { DraftNotice } from '@/components/forms/DraftNotice';
import { useDraftForm } from '@/components/forms/useDraftForm';

function DraftForm({ owner = 'account-a', record = 'experience-a', label = 'Formulaire', persistent = true, action = () => {} }) {
  const draft = useDraftForm(`test:${owner}:${record}`, {}, undefined, { persistent });
  return <form {...draft.formProps} onSubmit={draft.submit(action)} aria-label={label}>
    <label>Description<textarea name="description" defaultValue="Texte enregistré" /></label>
    <label>Langue<input type="checkbox" name="languages" value="fr" defaultChecked /></label>
    <label>Secret<input type="password" name="password" /></label>
    <button type="button" onClick={() => draft.clear()}>Succès confirmé</button>
    <NextIntlClientProvider locale="fr" messages={fr}><DraftNotice draft={draft} onReload={() => {}} /></NextIntlClientProvider>
  </form>;
}

describe('Brouillons persistants — interface utilisateur', () => {
  it('retrouve le texte après fermeture de la session navigateur', () => {
    const first = render(<DraftForm />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Mon travail à reprendre demain.' } });
    first.unmount();
    sessionStorage.clear();
    render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Mon travail à reprendre demain.');
  });
  it('avertit sans écraser le brouillon écrit depuis un autre onglet', () => {
    const first = render(<DraftForm label="Onglet A" />);
    const second = render(<DraftForm label="Onglet B" />);
    fireEvent.change(within(screen.getByRole('form', { name: 'Onglet A' })).getByLabelText('Description'), { target: { value: 'Travail de A' } });
    fireEvent.change(within(screen.getByRole('form', { name: 'Onglet B' })).getByLabelText('Description'), { target: { value: 'Travail de B' } });
    expect(within(screen.getByRole('form', { name: 'Onglet B' })).getByRole('alert')).toHaveTextContent('autre onglet');
    first.unmount(); second.unmount();
    render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Travail de A');
  });
  it('demande confirmation avant abandon et conserve le texte si on annule', () => {
    const view = render(<DraftForm />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Ne pas effacer sans accord' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner le brouillon' }));
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Les données déjà enregistrées');
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    view.unmount(); const reopened = render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Ne pas effacer sans accord');
    fireEvent.click(screen.getByRole('button', { name: 'Abandonner le brouillon' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer' }));
    // Reopening the form is the navigation boundary, not a database side channel.
    reopened.unmount(); render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Texte enregistré');
  });
  it('migre un ancien brouillon de cet onglet avant sa fermeture', () => {
    const old = render(<DraftForm persistent={false} />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Ancien brouillon à conserver' } });
    old.unmount(); const upgraded = render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Ancien brouillon à conserver');
    upgraded.unmount(); sessionStorage.clear(); render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Ancien brouillon à conserver');
  });
  it('signale immédiatement un stockage navigateur inaccessible sans bloquer la saisie', () => {
    vi.spyOn(Object.getPrototypeOf(localStorage), 'getItem').mockImplementation(() => { throw new DOMException('Disabled', 'SecurityError'); });
    render(<DraftForm />);
    expect(screen.getByRole('alert')).toHaveTextContent('indisponible');
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Texte encore éditable' } });
    expect(screen.getByLabelText('Description')).toHaveValue('Texte encore éditable');
  });
  it.each([{ owner: 'account-b' }, { record: 'experience-b' }])('sépare les brouillons : %j', props => {
    const first = render(<DraftForm />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Privé A' } });
    first.unmount(); const other = render(<DraftForm {...props} />);
    expect(screen.getByLabelText('Description')).toHaveValue('Texte enregistré');
    other.unmount(); render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Privé A');
  });
  it('ne restaure pas un brouillon de plus de sept jours', () => {
    const time = vi.spyOn(Date, 'now').mockReturnValue(1800000000000);
    const view = render(<DraftForm />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Ancien texte' } });
    view.unmount(); time.mockReturnValue(1800691200000); render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Texte enregistré');
  });
  it('conserve une case décochée, mais jamais un mot de passe', () => {
    const view = render(<DraftForm />);
    fireEvent.click(screen.getByLabelText('Langue'));
    fireEvent.change(screen.getByLabelText('Secret'), { target: { value: 'secret-fictif' } });
    view.unmount(); render(<DraftForm />);
    expect(screen.getByLabelText('Langue')).not.toBeChecked();
    expect(screen.getByLabelText('Secret')).toHaveValue('');
  });
  it('un succès confirmé empêche la réapparition de l’ancien brouillon', () => {
    const view = render(<DraftForm />);
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Enregistré' } });
    fireEvent.click(screen.getByRole('button', { name: 'Succès confirmé' }));
    view.unmount(); render(<DraftForm />);
    expect(screen.getByLabelText('Description')).toHaveValue('Texte enregistré');
  });
  it('signale un quota de stockage plein sans perdre la saisie courante', () => {
    render(<DraftForm />);
    vi.spyOn(Object.getPrototypeOf(localStorage), 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError'); });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Texte non perdu malgré quota' } });
    expect(screen.getByRole('alert')).toHaveTextContent('indisponible');
    expect(screen.getByLabelText('Description')).toHaveValue('Texte non perdu malgré quota');
  });
  it('bloque l’envoi si le conflit n’est découvert qu’au clic de soumission', () => {
    const action = vi.fn();
    render(<DraftForm label="A" />); render(<DraftForm label="B" action={action} />);
    fireEvent.change(within(screen.getByRole('form', { name: 'A' })).getByLabelText('Description'), { target: { value: 'Édition dans A' } });
    fireEvent.submit(screen.getByRole('form', { name: 'B' }));
    expect(action).not.toHaveBeenCalled();
  });
});
