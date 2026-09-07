import {render,screen,fireEvent} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {NextIntlClientProvider} from 'next-intl';
import {LoginForm} from '@/app/[locale]/connexion/LoginForm';
import {ForgotPasswordForm} from '@/app/[locale]/mot-de-passe-oublie/ForgotPasswordForm';
import fr from '@/messages/fr.json';
vi.mock('@/app/actions/auth',()=>({signIn:async()=>({error:'invalidCredentials'}),requestPasswordReset:async()=>({error:'generic'})}));
vi.mock('@/i18n/navigation',()=>({Link:({children,href}:{children:React.ReactNode;href:string})=><a href={href}>{children}</a>}));
it('conserve l’e-mail après refus du mot de passe',async()=>{
  render(<NextIntlClientProvider locale="fr" messages={fr}><LoginForm/></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText(fr.auth.email),{target:{value:'test@example.test'}});
  fireEvent.submit(screen.getByLabelText(fr.auth.email).closest('form')!);
  await screen.findByText(fr.auth.errors.invalidCredentials);
  expect(screen.getByLabelText(fr.auth.email)).toHaveValue('test@example.test');
});
it('affiche une erreur de récupération et conserve l’adresse et la langue',async()=>{
  render(<NextIntlClientProvider locale="de" messages={fr}><ForgotPasswordForm/></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText(fr.auth.email),{target:{value:'reset@example.test'}});
  const form=screen.getByLabelText(fr.auth.email).closest('form')!;
  fireEvent.submit(form);
  expect(await screen.findByRole('alert')).toHaveTextContent(fr.auth.errors.generic);
  expect(screen.getByLabelText(fr.auth.email)).toHaveValue('reset@example.test');
  expect(new FormData(form).get('locale')).toBe('de');
});
