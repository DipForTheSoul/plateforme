import {render,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import Page from '@/app/[locale]/devenir-praticien/page';
const state=vi.hoisted(()=>({settings:[] as {key:string;value:string}[]}));
vi.mock('@/lib/pack-settings',()=>({readPackSettings:async()=>({data:state.settings,error:null})}));
vi.mock('next-intl/server',()=>({setRequestLocale:vi.fn(),getTranslations:async()=>Object.assign((key:string)=>key,{raw:()=>[]})}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>({select:async()=>({data:state.settings})})})}));
vi.mock('@/i18n/navigation',()=>({Link:({children,...props}:React.ComponentProps<'a'>)=><a {...props}>{children}</a>}));
vi.mock('next/image',()=>({default:()=>null}));
vi.mock('@/components/PackPrice',()=>({PackPrice:({valueChf}:{valueChf:number})=><span>CHF {valueChf.toFixed(2)}</span>}));
afterEach(cleanup);
it('affiche les trois prix réduits et les prix barrés avec une promotion de 10 %',async()=>{
 state.settings=[{key:'promo_label',value:'Offre Méditation'},{key:'promo_discount_percent',value:'10'}];
 const {container}=render(await Page({params:Promise.resolve({locale:'fr'})}));
 expect(screen.getAllByText('CHF 22.50').length).toBeGreaterThan(0);
 expect(screen.getByText('CHF 90.00')).toBeInTheDocument();
 expect(screen.getByText('CHF 162.00')).toBeInTheDocument();
 expect([...container.querySelectorAll('del')].map(n=>n.textContent)).toEqual(['CHF 25.00','CHF 100.00','CHF 180.00']);
});
it('revient aux tarifs normaux lorsque la promotion est retirée',async()=>{
 state.settings=[];
 const {container}=render(await Page({params:Promise.resolve({locale:'fr'})}));
 expect(screen.getByText('CHF 100.00')).toBeInTheDocument();
 expect(container.querySelector('del')).toBeNull();
});
