import {render,screen,fireEvent} from '@testing-library/react';
import {beforeEach,expect,it,vi} from 'vitest';
import {NextIntlClientProvider} from 'next-intl';
import {LoginForm} from '@/app/[locale]/connexion/LoginForm';
import {ForgotPasswordForm} from '@/app/[locale]/mot-de-passe-oublie/ForgotPasswordForm';
import fr from '@/messages/fr.json';
const state=vi.hoisted(()=>({resetGate:{error:'generic'} as {error?:string;success?:string},providerError:null as null|{status?:number},email:'',redirectTo:''}));
vi.mock('@/app/actions/auth',()=>({signIn:async()=>({error:'invalidCredentials'}),requestPasswordReset:async()=>state.resetGate}));
vi.mock('@/lib/supabase/client',()=>({createClient:()=>({auth:{resetPasswordForEmail:async(email:string,options:{redirectTo:string})=>{state.email=email;state.redirectTo=options.redirectTo;return {error:state.providerError};}}})}));
vi.mock('@/i18n/navigation',()=>({Link:({children,href}:{children:React.ReactNode;href:string})=><a href={href}>{children}</a>}));
beforeEach(()=>{state.resetGate={error:'generic'};state.providerError=null;state.email='';state.redirectTo='';});
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
it('crée le lien de récupération sur l’origine réellement visitée',async()=>{
  state.resetGate={success:'resetAllowed'};
  render(<NextIntlClientProvider locale="de" messages={fr}><ForgotPasswordForm/></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText(fr.auth.email),{target:{value:'reset@example.test'}});
  fireEvent.submit(screen.getByLabelText(fr.auth.email).closest('form')!);
  await screen.findByText(fr.auth.resetSent);
  expect(state.email).toBe('reset@example.test');
  const callback=new URL(state.redirectTo);
  expect(callback.origin).toBe(window.location.origin);
  expect(callback.pathname).toBe('/api/auth/callback');
  expect(callback.searchParams.get('next')).toBe('/de/reinitialiser-mot-de-passe');
});
it('ne contourne pas la limite côté serveur',async()=>{
  state.resetGate={success:'resetSent'};
  render(<NextIntlClientProvider locale="fr" messages={fr}><ForgotPasswordForm/></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText(fr.auth.email),{target:{value:'reset@example.test'}});
  fireEvent.submit(screen.getByLabelText(fr.auth.email).closest('form')!);
  await screen.findByText(fr.auth.resetSent);
  expect(state.email).toBe('');
});
it('affiche une erreur neutre lorsque le fournisseur de récupération est indisponible',async()=>{
  state.resetGate={success:'resetAllowed'};
  state.providerError={status:503};
  render(<NextIntlClientProvider locale="fr" messages={fr}><ForgotPasswordForm/></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText(fr.auth.email),{target:{value:'reset@example.test'}});
  fireEvent.submit(screen.getByLabelText(fr.auth.email).closest('form')!);
  expect(await screen.findByRole('alert')).toHaveTextContent(fr.auth.errors.generic);
});
