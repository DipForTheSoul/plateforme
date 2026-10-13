import {expect,it,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {MailerLiteSync} from '@/app/[locale]/admin/newsletter/MailerLiteSync';
vi.mock('next-intl',()=>({useTranslations:()=>((key:string)=>key)}));
vi.mock('@/app/actions/contacts',()=>({syncContactsToMailerLite:async()=>({processed:5,synced:4,issues:[{email:'qa@example.test',reason:'contact désabonné'}]})}));
it('affiche un bilan global et identifie le contact à vérifier sans annoncer une panne',async()=>{
  render(<MailerLiteSync/>);
  fireEvent.submit(screen.getByRole('button').closest('form')!);
  expect(await screen.findByText(/Traitement terminé : 4 contacts synchronisés sur 5 examinés ; 1 à vérifier/)).toBeVisible();
  expect(screen.getByText('qa@example.test')).toBeVisible();
  expect(screen.getByText(/contact désabonné/)).toBeVisible();
  expect(screen.queryByText(/Synchronisation interrompue/)).toBeNull();
});
