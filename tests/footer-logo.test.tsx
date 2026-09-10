import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {LogoLink} from '@/components/LogoLink';
import fr from '@/messages/fr.json';
vi.mock('@/i18n/navigation',()=>({usePathname:()=> '/',Link:({children,...props}:React.ComponentProps<'a'>)=><a {...props}>{children}</a>}));
vi.mock('next/image',()=>({default:()=>null}));
it('le logo de pied de page est un lien accueil et remonte en haut',()=>{
  const scroll=vi.spyOn(window,'scrollTo').mockImplementation(()=>{});
  render(<NextIntlClientProvider locale="fr" messages={fr}><LogoLink footer/></NextIntlClientProvider>);
  const link=screen.getByRole('link',{name:'ForTheSoul — Accueil'});
  expect(link).toHaveAttribute('href','/');fireEvent.click(link);
  expect(scroll).toHaveBeenCalledWith({top:0,behavior:'smooth'});
  scroll.mockRestore();
});
