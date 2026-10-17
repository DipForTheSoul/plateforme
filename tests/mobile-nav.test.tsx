import {fireEvent,render,screen} from '@testing-library/react';
import {it,expect,vi} from 'vitest';
import {MobileNav} from '@/components/MobileNav';
vi.mock('@/i18n/navigation',()=>({Link:({href,children,...props}:{href:string;children:React.ReactNode})=><a href={href} {...props} onClick={event=>event.preventDefault()}>{children}</a>}));
it('ferme le menu après un clic Administration, y compris sur la page courante',()=>{
 const {container}=render(<MobileNav links={[]} authLink={{href:'/admin',label:'Administration'}}/>);
 const menu=container.querySelector('details')!;menu.open=true;
 fireEvent.click(screen.getByRole('link',{name:'Administration'}));expect(menu.open).toBe(false);
 menu.open=true;fireEvent.click(screen.getByRole('link',{name:'Administration'}));expect(menu.open).toBe(false);
});
