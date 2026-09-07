import {render,screen,fireEvent} from '@testing-library/react';
import {expect,it,vi} from 'vitest';
import {NextIntlClientProvider} from 'next-intl';
import {LoginForm} from '@/app/[locale]/connexion/LoginForm';
import fr from '@/messages/fr.json';
vi.mock('@/app/actions/auth',()=>({signIn:async()=>({error:'invalidCredentials'})}));
vi.mock('@/i18n/navigation',()=>({Link:({children,href}:{children:React.ReactNode;href:string})=><a href={href}>{children}</a>}));
it('conserve l’e-mail après refus du mot de passe',async()=>{
  render(<NextIntlClientProvider locale="fr" messages={fr}><LoginForm/></NextIntlClientProvider>);
  fireEvent.change(screen.getByLabelText(fr.auth.email),{target:{value:'test@example.test'}});
  fireEvent.submit(screen.getByLabelText(fr.auth.email).closest('form')!);
  await screen.findByText(fr.auth.errors.invalidCredentials);
  expect(screen.getByLabelText(fr.auth.email)).toHaveValue('test@example.test');
});
