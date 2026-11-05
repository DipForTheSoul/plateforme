import {expect,it,vi} from 'vitest';
vi.mock('@/lib/queries',()=>({getSitemapEvents:async()=>[{slug:'ancienne-experience',updated_at:'2026-05-01T00:00:00Z'}],getApprovedPractitioners:async()=>[]}));
import sitemap from '@/app/sitemap';
it('includes published detail pages and their language alternatives independently of the upcoming catalogue',async()=>{
 const entries=await sitemap();const event=entries.find(x=>x.url.endsWith('/experiences/ancienne-experience'));
 expect(event).toBeDefined();expect(event?.alternates?.languages?.de).toContain('/de/erlebnisse/ancienne-experience');
});
