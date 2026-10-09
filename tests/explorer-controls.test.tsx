import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {ExplorerControls} from '@/components/ExplorerControls';
import {ViewToggle} from '@/components/ViewToggle';
import {ExplorerNavigation} from '@/components/ExplorerNavigation';
import fr from '@/messages/fr.json';
import { CurrencyProvider, useCurrency } from '@/components/CurrencyProvider';
import de from '@/messages/de.json';
import en from '@/messages/en.json';
const {replace}=vi.hoisted(()=>({replace:vi.fn()}));
vi.mock('next/navigation',()=>({useSearchParams:()=>new URLSearchParams()}));
vi.mock('@/i18n/navigation',()=>({useRouter:()=>({replace}),usePathname:()=>'/experiences'}));
function SwitchCurrency(){const {setCurrency}=useCurrency();return <><button onClick={()=>setCurrency('EUR')}>Euros</button><button onClick={()=>setCurrency('CHF')}>Francs</button></>;}
it.each([['fr',fr,'Prix max'],['de',de,'Max. Preis'],['en',en,'Max price']] as const)('conserve le seuil affiché en CHF en %s quelle que soit la devise du catalogue', (locale,messages,label)=>{
  localStorage.removeItem('fts-currency');
  render(<NextIntlClientProvider locale={locale} messages={messages}><CurrencyProvider rateEur={1.05}><SwitchCurrency/><ExplorerNavigation><ExplorerControls categories={[]} practitioners={[]} countries={[]} cantons={[]} eventDays={[]}/></ExplorerNavigation></CurrencyProvider></NextIntlClientProvider>);
  fireEvent.click(screen.getByRole('button',{name:'Euros'}));
  const price=screen.getByRole('combobox',{name:`${label} (CHF)`});
  expect(screen.getByRole('option',{name:'≤ CHF 50.–',hidden:true})).toHaveValue('50');
  fireEvent.change(price,{target:{value:'50'}});
  expect(new URL(replace.mock.calls.at(-1)![0],'http://localhost').searchParams.get('prix')).toBe('50');
  fireEvent.click(screen.getByRole('button',{name:'Francs'}));
  expect(screen.getByRole('combobox',{name:`${label} (CHF)`})).toBeInTheDocument();
  localStorage.removeItem('fts-currency');
});
it('cumule les changements rapides de filtres avant la réponse de navigation',()=>{
  render(<NextIntlClientProvider locale="fr" messages={fr}><ExplorerNavigation><ExplorerControls categories={[]} practitioners={[]} countries={[{code:'CH',name:'Suisse'}]} cantons={['VD']} eventDays={[]}/></ExplorerNavigation></NextIntlClientProvider>);
  fireEvent.click(screen.getByRole('button',{name:'Filtres'}));
  fireEvent.change(screen.getByRole('combobox',{name:'Langue'}),{target:{value:'fr'}});
  fireEvent.change(screen.getByRole('combobox',{name:'Pays'}),{target:{value:'CH'}});
  fireEvent.change(screen.getByRole('combobox',{name:'Prix max (CHF)'}),{target:{value:'50'}});
  fireEvent.change(screen.getByRole('combobox',{name:'Durée max'}),{target:{value:'90'}});
  const url=new URL(replace.mock.calls.at(-1)![0],'http://localhost');
  expect(Object.fromEntries(url.searchParams)).toEqual({langue:'fr',pays:'CH',prix:'50',duree:'90'});
});
it('laisse choisir les deux dates avant de soumettre le filtre',()=>{
  render(<NextIntlClientProvider locale="fr" messages={fr}><ExplorerNavigation><ViewToggle/><ExplorerControls categories={[]} practitioners={[]} countries={[]} cantons={[]} eventDays={[]}/></ExplorerNavigation></NextIntlClientProvider>);
  fireEvent.click(screen.getByRole('button',{name:'Carte'}));
  fireEvent.change(screen.getByLabelText('Du'),{target:{value:'2026-10-17'}});
  fireEvent.change(screen.getByLabelText('Au'),{target:{value:'2026-10-18'}});
  expect(screen.getByLabelText('Du')).toHaveValue('2026-10-17');
  expect(screen.getByLabelText('Au')).toHaveValue('2026-10-18');
  const form=screen.getByRole('button',{name:'Filtrer'}).closest('form')!;
  expect(Object.fromEntries(new FormData(form))).toEqual({du:'2026-10-17',au:'2026-10-18'});
  fireEvent.change(screen.getByRole('combobox',{name:'Langue'}),{target:{value:'fr'}});
  const url=new URL(replace.mock.calls.at(-1)![0],'http://localhost');
  expect(Object.fromEntries(url.searchParams)).toEqual({vue:'carte',langue:'fr'});
});
