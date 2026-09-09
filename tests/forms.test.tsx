import { describe, it, expect, vi } from 'vitest';
import { StrictMode } from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import fr from '@/messages/fr.json';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
import { EventForm } from '@/components/forms/EventForm';
import {removeOccurrence} from '@/app/actions/events';
import { ProfileForm } from '@/app/[locale]/espace-praticien/profil/ProfileForm';
import type { Practitioner, Category, Event } from '@/types/database';

vi.mock('@/app/actions/events', () => ({ createEvent: vi.fn(), updateEvent: vi.fn(), removeOccurrence: vi.fn() }));
vi.mock('@/i18n/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/app/actions/practitioner', () => ({ updatePractitionerProfile: vi.fn() }));
vi.mock('@/app/actions/venues', () => ({ createVenue: vi.fn() }));
vi.mock('@/components/forms/ImageUploader', () => ({ ImageUploader: ({images}:{images:string[]}) => <span>Upload {images.length}</span> }));
const categories = [{ id: '10000000-0000-4000-8000-000000000001', name: 'Yoga', slug: 'yoga-somatique' }] as Category[];
const practitioner = { id: 'p1', name: 'Initial', bio: 'Ancienne biographie', photos: [], languages: ['fr'], specialties: [], contact: {}, links: {} } as unknown as Practitioner;
const messages = { fr, de, en };
const wrap = (child: React.ReactNode, locale: keyof typeof messages = 'fr') => <NextIntlClientProvider locale={locale} messages={messages[locale]}>{child}</NextIntlClientProvider>;
const eventForm = (action = vi.fn(async () => ({ error: 'Univers manquant' }))) => <EventForm categories={categories} venues={[]} defaultLanguages={['fr']} action={action} />;

describe('Régressions signalées par Didier', () => {
  it('exige un tarif explicite, réserve le montant au prix fixe et conserve le brouillon', async () => {
    const view = render(wrap(eventForm()));
    const mode = screen.getByLabelText(fr.eventForm.priceType);
    const amount = screen.getByLabelText(fr.eventForm.priceAmount);
    expect(mode).toBeRequired();
    expect(mode).toHaveValue('');
    expect(amount).toBeDisabled();
    fireEvent.change(mode, {target:{value:'fixed'}});
    expect(amount).toBeRequired();
    fireEvent.change(amount, {target:{value:'79'}});
    fireEvent.change(mode, {target:{value:'free'}});
    expect(amount).toBeDisabled();
    fireEvent.change(mode, {target:{value:'fixed'}});
    expect(amount).toHaveValue(79);
    view.unmount();
    render(wrap(eventForm()));
    await waitFor(() => expect(screen.getByLabelText(fr.eventForm.priceType)).toHaveValue('fixed'));
    expect(screen.getByLabelText(fr.eventForm.priceAmount)).toHaveValue(79);
  });
  it('permet deux suppressions successives de dates sans faux brouillon bloquant',async()=>{
    vi.mocked(removeOccurrence).mockResolvedValue({success:'Date supprimée.',updatedAt:'2026-09-09T12:00:00Z'});
    const event={id:'series',title:'Série de test',start_date:'2026-10-09T09:00:00Z',images:[],languages:['fr'],recurrence:'weekly',recurrence_count:4} as unknown as Event;
    render(wrap(<EventForm categories={categories} venues={[]} defaultLanguages={['fr']} event={event} occurrences={[16,23,30].map(day=>({id:`day-${day}`,start_date:`2026-10-${day}T09:00:00Z`}))}/>));
    const section=within(screen.getByText(fr.eventForm.occurrencesList).closest('section')!);
    fireEvent.click(section.getAllByRole('button',{name:fr.eventForm.removeOccurrence})[1]);
    await waitFor(()=>expect(section.getAllByRole('button',{name:fr.eventForm.removeOccurrence})).toHaveLength(3));
    await waitFor(()=>expect(section.getAllByRole('button',{name:fr.eventForm.removeOccurrence})[1]).toBeEnabled());
    fireEvent.click(section.getAllByRole('button',{name:fr.eventForm.removeOccurrence})[1]);
    await waitFor(()=>expect(section.getAllByRole('button',{name:fr.eventForm.removeOccurrence})).toHaveLength(2));
  });
  it('masque les sélecteurs de durée sur plusieurs jours et les retrouve au retour sur une journée', () => {
    render(wrap(eventForm()));
    fireEvent.change(screen.getByLabelText(fr.eventForm.durationHoursLabel), {target:{value:'1'}});
    fireEvent.change(screen.getByLabelText(fr.eventForm.durationMinutesLabel), {target:{value:'35'}});
    fireEvent.click(screen.getByRole('button',{name:fr.eventForm.multiDay}));
    expect(screen.getByLabelText(fr.eventForm.durationHoursLabel)).not.toBeVisible();
    expect(screen.getByLabelText(fr.eventForm.durationMinutesLabel)).toBeDisabled();
    fireEvent.click(screen.getByRole('button',{name:fr.eventForm.oneDay}));
    expect(screen.getByLabelText(fr.eventForm.durationHoursLabel)).toHaveValue('1');
    expect(screen.getByLabelText(fr.eventForm.durationMinutesLabel)).toHaveValue('35');
  });
  it('décompose la durée enregistrée en édition', () => {
    const event = { id: 'e1', title: 'Yoga', start_date: '2026-09-11T09:00:00Z', duration_minutes: 95, images: [], languages: ['fr'] } as unknown as Event;
    render(wrap(<EventForm categories={categories} venues={[]} defaultLanguages={['fr']} event={event} />));
    expect(screen.getByLabelText(fr.eventForm.durationHoursLabel)).toHaveValue('1');
    expect(screen.getByLabelText(fr.eventForm.durationMinutesLabel)).toHaveValue('35');
  });
  it.each([['de', de.eventForm], ['en', en.eventForm]] as const)('traduit les deux sélecteurs en %s', (locale, labels) => {
    render(wrap(eventForm(), locale));
    expect(screen.getByLabelText(labels.durationHoursLabel)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.durationMinutesLabel)).toBeInTheDocument();
  });
  it('reprend un ancien brouillon de durée décimale dans les deux sélecteurs', async () => {
    sessionStorage.setItem('fts.draft.v1:event:local:new',JSON.stringify({at:Date.now(),fields:{duration_minutes:['1.5']},extra:{images:[],recurrence:'',recurrenceCount:4}}));
    render(wrap(eventForm()));
    await waitFor(()=>expect(screen.getByLabelText(fr.eventForm.durationHoursLabel)).toHaveValue('1'));
    expect(screen.getByLabelText(fr.eventForm.durationMinutesLabel)).toHaveValue('30');
  });
  it('ne transporte pas le brouillon lorsque le compte change sans démontage de la page', () => {
    const form = (owner: string) => wrap(<EventForm draftOwner={owner} categories={categories} venues={[]} defaultLanguages={['fr']} />);
    const view = render(form('account-a'));
    fireEvent.change(screen.getByLabelText(fr.eventForm.titleLabel), { target: { value: 'Texte privé A' } });
    view.rerender(form('account-b'));
    expect(screen.getByLabelText(fr.eventForm.titleLabel)).toHaveValue('');
    view.rerender(form('account-a'));
    expect(screen.getByLabelText(fr.eventForm.titleLabel)).toHaveValue('Texte privé A');
  });
  it('ne remplace pas les photos restaurées par un brouillon vide au double montage React',()=>{
    sessionStorage.setItem('fts.draft.v1:event:local:new',JSON.stringify({at:Date.now(),fields:{title:['Brouillon']},extra:{images:['https://example.test/photo.webp'],recurrence:'weekly',recurrenceCount:3}}));
    render(<StrictMode>{wrap(eventForm())}</StrictMode>);
    expect(screen.getByText('Upload 1')).toBeInTheDocument();
  });
  it('restaure la date effectivement saisie même si le dernier état React du brouillon est en retard', async () => {
    sessionStorage.setItem('fts.draft.v1:event:local:new',JSON.stringify({at:Date.now(),fields:{start_date:['2026-10-09T11:00'],title:['Brouillon']},extra:{startDate:'',endDate:'',recurrence:'',images:[]}}));
    render(wrap(eventForm(),'de'));
    await waitFor(()=>expect(screen.getByLabelText(de.eventForm.startLabel)).toHaveValue('2026-10-09T11:00'));
    fireEvent.change(screen.getByLabelText(de.eventForm.recurrenceLabel),{target:{value:'weekly'}});
    expect(screen.getByLabelText(de.eventForm.startLabel)).toHaveValue('2026-10-09T11:00');
  });
  it('conserve le texte de l’expérience après une erreur serveur', async () => {
    const action = vi.fn(async () => ({ error: 'Univers manquant' }));
    render(wrap(eventForm(action)));
    fireEvent.change(screen.getByLabelText(fr.eventForm.titleLabel), { target: { value: 'Love Lounge' } });
    fireEvent.change(screen.getByLabelText(fr.eventForm.descriptionLabel), { target: { value: 'Un texte très long que le client ne doit jamais perdre.' } });
    fireEvent.submit(screen.getByLabelText(fr.eventForm.titleLabel).closest('form')!);
    await screen.findByText('Univers manquant');
    expect(screen.getByLabelText(fr.eventForm.titleLabel)).toHaveValue('Love Lounge');
    expect(screen.getByLabelText(fr.eventForm.descriptionLabel)).toHaveValue('Un texte très long que le client ne doit jamais perdre.');
  });
  it('restaure une expérience après changement de langue / remontage', async () => {
    const view = render(wrap(eventForm()));
    fireEvent.change(screen.getByLabelText(fr.eventForm.titleLabel), { target: { value: 'Love Lounge' } });
    fireEvent.change(screen.getByLabelText(fr.eventForm.descriptionLabel), { target: { value: 'Meine Beschreibung soll erhalten bleiben.' } });
    fireEvent.input(screen.getByLabelText(fr.eventForm.startLabel), { target: { value: '2026-10-09T11:00' } });
    view.unmount();
    render(wrap(eventForm(), 'de'));
    await waitFor(() => expect(screen.getByLabelText(de.eventForm.titleLabel)).toHaveValue('Love Lounge'));
    expect(screen.getByLabelText(de.eventForm.startLabel)).toHaveValue('2026-10-09T11:00');
  });
  it('conserve la biographie après enregistrement réussi du profil', async () => {
    render(wrap(<ProfileForm practitioner={practitioner} action={async () => ({ success: 'Profil mis à jour.' })} />));
    fireEvent.change(screen.getByLabelText(fr.practitioner.bio), { target: { value: 'Ma nouvelle biographie très importante.' } });
    fireEvent.submit(screen.getByLabelText(fr.practitioner.bio).closest('form')!);
    await screen.findByText('Profil mis à jour.');
    expect(screen.getByLabelText(fr.practitioner.bio)).toHaveValue('Ma nouvelle biographie très importante.');
  });
  it('accepte un site sans https dans le navigateur', () => {
    render(wrap(<ProfileForm practitioner={practitioner} />));
    const input = screen.getByLabelText(fr.practitioner.website) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'www.monsite.ch' } });
    fireEvent.blur(input);
    expect(input.checkValidity()).toBe(true);
  });
  it('affiche 11 h suisses à l’édition, quel que soit le fuseau du poste', () => {
    const event = { id: 'e1', title: 'Yoga', start_date: '2026-09-11T09:00:00Z', images: [], languages: ['fr'] } as unknown as Event;
    render(wrap(<EventForm categories={categories} venues={[]} defaultLanguages={['fr']} event={event} />));
    expect(screen.getByLabelText(fr.eventForm.startLabel)).toHaveValue('2026-09-11T11:00');
  });
  it('permet de modifier la récurrence après publication', () => {
    const event = { id: 'e1', title: 'Yoga', start_date: '2026-09-11T09:00:00Z', images: [], languages: ['fr'] } as unknown as Event;
    render(wrap(<EventForm categories={categories} venues={[]} defaultLanguages={['fr']} event={event} />));
    expect(screen.getByLabelText(fr.eventForm.recurrenceLabel)).toBeInTheDocument();
  });
});
