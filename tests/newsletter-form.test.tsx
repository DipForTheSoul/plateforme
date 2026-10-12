import {render, screen, waitFor} from '@testing-library/react';
import {beforeEach, expect, it, vi} from 'vitest';

const state = vi.hoisted(() => ({status: 'success' as 'idle'|'success'|'error'}));

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useActionState: () => [{status: state.status}, vi.fn(), false],
  };
});
vi.mock('@/app/actions/newsletter', () => ({subscribeToNewsletter: vi.fn()}));

import {NewsletterForm} from '@/components/NewsletterForm';

beforeEach(() => {
  state.status = 'success';
  Element.prototype.scrollIntoView = vi.fn();
});

it('garde la confirmation visible et lui donne le focus après inscription', async () => {
  render(<NewsletterForm
    placeholder="Email"
    consentLabel="Consentement"
    buttonLabel="Inscription"
    successMessage="Inscription confirmée"
    errorMessage="Erreur"
  />);
  const result = screen.getByRole('status');
  await waitFor(() => expect(result).toHaveFocus());
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({block: 'nearest'});
});

it('annonce également une erreur sans renvoyer en haut de page', async () => {
  state.status = 'error';
  render(<NewsletterForm
    placeholder="Email"
    consentLabel="Consentement"
    buttonLabel="Inscription"
    successMessage="Inscription confirmée"
    errorMessage="Erreur visible"
  />);
  const result = screen.getByRole('alert');
  await waitFor(() => expect(result).toHaveFocus());
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({block: 'nearest'});
});
