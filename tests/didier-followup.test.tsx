import {expect,it,vi} from 'vitest';
import {fireEvent,render,screen} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {editorToMarkdown,markdownToEditorHtml} from '@/components/forms/description-editor-markdown';
import {FeaturedPurchasePanel} from '@/components/forms/FeaturedPurchasePanel';
import {SettingNumberForm} from '@/components/admin/SettingNumberForm';
vi.mock('@/app/actions/settings',()=>({updateSettings:vi.fn()}));

it('conserve exactement les paragraphes après cinq cycles ouverture/enregistrement',()=>{
  const text='**Paragraphe de test**\n\nDeuxième paragraphe de test.';
  let value=text;
  for(let i=0;i<5;i++){
    const editor=document.createElement('div');editor.innerHTML=markdownToEditorHtml(value);
    value=editorToMarkdown(editor);expect(value).toBe(text);
  }
});
it('ouvre le panneau sous l’offre sans lancer de paiement et affiche le tarif configuré',()=>{
  const fetch=vi.spyOn(globalThis,'fetch');
  render(<NextIntlClientProvider locale="fr" messages={{}}><FeaturedPurchasePanel eventId="qa" price={27.5} days={45} pendingLabel="Ouverture"/></NextIntlClientProvider>);
  expect(screen.queryByRole('button',{name:'Payer avec Stripe'})).toBeNull();
  fireEvent.click(screen.getByRole('button',{name:'Mettre en avant'}));
  expect(screen.getByText('45 jours.')).toBeVisible();
  expect(screen.getByText(/CHF 27,50/)).toBeVisible();
  expect(screen.getByRole('button',{name:'Payer avec Stripe'})).toBeVisible();
  expect(fetch).not.toHaveBeenCalled();fetch.mockRestore();
});
it('permet un tarif administrateur en centimes',()=>{
  render(<SettingNumberForm settingKey="featured_price_chf" label="Tarif" defaultValue="27.50" min={0.5} step={0.01}/>);
  expect((screen.getByLabelText('Tarif') as HTMLInputElement).checkValidity()).toBe(true);
});
