import {expect,it,vi} from 'vitest';
import {NextRequest,NextResponse} from 'next/server';
import {pageAlternates,SITE_URL} from '@/lib/metadata';
import {publicPath,publicPathnames} from '@/i18n/public-pathnames';
vi.mock('next-intl/middleware',()=>({default:()=>()=>NextResponse.next()}));
vi.mock('@/lib/supabase/middleware',()=>({updateSession:async(_req:unknown,response:NextResponse)=>response}));
import proxy from '@/proxy';
it.each([['de','/de/angebot-erstellen'],['en','/en/become-a-practitioner']])('keeps old links and query parameters in %s',async(locale,target)=>{
 const response=await proxy(new NextRequest(`https://example.test/${locale}/devenir-praticien?utm_source=facebook`));
 expect(response.status).toBe(308);expect(response.headers.get('location')).toBe(`https://example.test${target}?utm_source=facebook`);
 expect(pageAlternates('/devenir-praticien',locale).canonical).toBe(SITE_URL+target);
});
it('preserves French and unrelated/private paths',()=>{
 expect(publicPath('/devenir-praticien','fr')).toBe('/devenir-praticien');
 expect(publicPath('/admin','de')).toBe('/de/admin');
 expect(publicPath('/experiences/my-event','en')).toBe('/en/experiences/my-event');
});
it.each(Object.entries(publicPathnames).flatMap(([path,translations])=>
  ['de','en'].map(locale=>[path,locale,translations[locale as 'de'|'en']] as const)
))('localizes %s in %s and keeps previously shared links',async(template,locale,target)=>{
 const path=template.replace(/\[[^\]]+\]/g,'sample-id');
 const translated=target.replace(/\[[^\]]+\]/g,'sample-id');
 expect(publicPath(path,locale)).toBe(`/${locale}${translated}`);
 expect(pageAlternates(path,locale).canonical).toBe(`${SITE_URL}/${locale}${translated}`);
 const response=await proxy(new NextRequest(`https://example.test/${locale}${path}?q=test&vue=liste`));
 if(path!==translated){
  expect(response.status).toBe(308);
  expect(response.headers.get('location')).toBe(`https://example.test/${locale}${translated}?q=test&vue=liste`);
 }else expect(response.status).toBe(200);
});
it('preserves detail identifiers, fragments, and query values without translating names',()=>{
 expect(publicPath('/praticiens/picamoles-didier-123?q=danse#contact','en')).toBe('/en/practitioners/picamoles-didier-123?q=danse#contact');
 expect(publicPath('/lieux/a-b-c','de')).toBe('/de/orte/a-b-c');
 expect(publicPath('/experiences/danse-soufie-abc','fr')).toBe('/experiences/danse-soufie-abc');
 expect(publicPath('/api/events/abc/ics','de')).toBe('/de/api/events/abc/ics');
 expect(publicPath('/admin/praticiens/private-id','en')).toBe('/en/admin/praticiens/private-id');
});
