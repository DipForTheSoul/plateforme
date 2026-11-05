import {expect,it,vi} from 'vitest';
import {NextRequest,NextResponse} from 'next/server';
import {pageAlternates,SITE_URL} from '@/lib/metadata';
import {publicPath} from '@/i18n/public-pathnames';
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
