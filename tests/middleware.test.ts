// @vitest-environment node
import {NextRequest,NextResponse} from 'next/server';
import {expect,it,vi,beforeEach} from 'vitest';
import {updateSession} from '@/lib/supabase/middleware';
const mock=vi.hoisted(()=>({user:null as null|{id:string},refresh:false}));
vi.mock('@supabase/ssr',()=>({createServerClient:(_url:unknown,_key:unknown,options:{cookies:{setAll:(cookies:{name:string;value:string;options:object}[])=>void}})=>({auth:{getUser:async()=>{if(mock.refresh)options.cookies.setAll([{name:'sb-test-auth-token',value:'new-session',options:{path:'/'}}]);return {data:{user:mock.user}};}}})}));
beforeEach(()=>{mock.user=null;mock.refresh=false;});
it('protège aussi /fr/admin et conserve le retour en langue allemande',async()=>{
  const fr=await updateSession(new NextRequest('http://localhost/fr/admin'),NextResponse.next());
  expect(fr.status).toBe(307);
  const de=await updateSession(new NextRequest('http://localhost/de/espace-praticien/profil?x=1'),NextResponse.next());
  const location=new URL(de.headers.get('location')!);
  expect(location.pathname).toBe('/de/connexion');expect(location.searchParams.get('next')).toBe('/de/espace-praticien/profil?x=1');
});
it('transmet la session rafraîchie au navigateur ET aux composants serveur sans perdre la locale',async()=>{
  mock.user={id:'local'};mock.refresh=true;
  const initial=NextResponse.next({request:{headers:new Headers({'x-next-intl-locale':'de'})}});
  const response=await updateSession(new NextRequest('http://localhost/de/admin'),initial);
  expect(response.cookies.get('sb-test-auth-token')?.value).toBe('new-session');
  expect(response.headers.get('x-middleware-request-cookie')).toContain('sb-test-auth-token=new-session');
  expect(response.headers.get('x-middleware-override-headers')).toContain('x-next-intl-locale');
});
