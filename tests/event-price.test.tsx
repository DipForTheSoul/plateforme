import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { Price } from '@/components/Price';
import { eventPriceMode } from '@/lib/event-price';
import { parseEventForm } from '@/lib/event-input';
import fr from '@/messages/fr.json';

function form(mode?: string, price = '') {
  const fd = new FormData();
  Object.entries({title:'Test tarif',description:'Description assez longue pour un tarif.',category_ids:'10000000-0000-4000-8000-000000000001',start_date:'2026-10-01T11:00',languages:'fr',price}).forEach(([k,v]) => fd.set(k,v));
  if(mode !== undefined) fd.set('price_mode', mode);
  return fd;
}
it.each([undefined, '', 'unspecified', 'bad'])('refuse un choix absent ou invalide : %s', mode => {
  expect(parseEventForm(form(mode)).success).toBe(false);
});
it.each(['', '0', '-1', 'invalid'])('refuse un prix fixe sans montant positif : %s', price => {
  expect(parseEventForm(form('fixed', price)).success).toBe(false);
});
it.each(['free', 'flexible'])('enregistre explicitement %s sans conserver un ancien montant', mode => {
  const result = parseEventForm(form(mode,'79'));
  expect(result.success && {mode:result.data.price_mode,price:result.data.price}).toEqual({mode,price:0});
});
it('conserve le montant positif du tarif fixe', () => {
  const result = parseEventForm(form('fixed','79.50'));
  expect(result.success && result.data.price).toBe(79.5);
});
it('ne transforme jamais les anciens prix en gratuit', () => {
  expect(eventPriceMode(null)).toBe('unspecified');
  expect(eventPriceMode(0)).toBe('flexible');
  expect(eventPriceMode(79)).toBe('fixed');
});
it.each([['free',0,'Gratuit'],['flexible',0,'Prix libre'],['unspecified',null,'Prix non renseigné'],['fixed',79,'CHF 79.–']] as const)('rend le tarif %s sans ambiguïté', (mode,value,text) => {
  render(<NextIntlClientProvider locale="fr" messages={fr}><Price value={value} mode={mode} freeLabel="Prix libre" /></NextIntlClientProvider>);
  expect(screen.getByText(text)).toBeInTheDocument();
});
