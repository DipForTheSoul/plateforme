import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,render} from '@testing-library/react';
import {NextIntlClientProvider} from 'next-intl';
import {LocaleSwitcher} from '@/components/LocaleSwitcher';

const state=vi.hoisted(()=>({path:'/praticiens/[slug]',params:{locale:'de',slug:'picamoles-abc'} as Record<string,string>,links:[] as unknown[]}));
vi.mock('next/navigation',()=>({useParams:()=>state.params}));
vi.mock('@/i18n/navigation',()=>({usePathname:()=>state.path,Link:(props:{href:unknown;locale:string;children:React.ReactNode})=>{
 state.links.push({href:props.href,locale:props.locale});return <a>{props.children}</a>;
}}));
afterEach(cleanup);

it.each([
 ['/praticiens/[slug]',{locale:'de',slug:'picamoles-abc'}],
 ['/experiences/[slug]',{locale:'de',slug:'danse-soufie-abc'}],
 ['/lieux/[id]',{locale:'de',id:'venue-abc'}],
] as const)('preserves the same object when changing language from %s',(path,params)=>{
 state.path=path;state.params={...params};state.links=[];
 render(<NextIntlClientProvider locale="de" messages={{}}><LocaleSwitcher/></NextIntlClientProvider>);
 for(const locale of ['fr','de','en'])expect(state.links).toContainEqual({locale,href:{pathname:path,params}});
});
