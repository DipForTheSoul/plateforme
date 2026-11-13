// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { GET } from '@/app/api/events/[slug]/ics/route';
vi.mock('@/lib/metadata',()=>({SITE_URL:'https://www.forthesoul.ch'}));
vi.mock('@/lib/queries',()=>({getEventBySlug:async(slug:string)=>slug==='unknown'?null:{id:'stable-event-id',slug:'danse-soufie',status:'approved',title:'Danse',start_date:'2030-11-20T10:00:00Z',duration_minutes:60,description:'Texte',venue:null}}));
it('conserve l’identité de l’agenda et utilise l’adresse publique courte du domaine de référence',async()=>{
 const response=await GET(new Request('https://www.forthesoul.ch/api/events/ancienne-adresse/ics'),{params:Promise.resolve({slug:'ancienne-adresse'})});
 const text=(await response.text()).replace(/\r\n /g,'');
 expect(response.status).toBe(200);expect(text).toContain('UID:stable-event-id@forthesoul.ch');
 expect(text).toContain('URL:https://www.forthesoul.ch/experiences/danse-soufie');
});
it('refuse une fiche absente plutôt que produire un lien d’agenda invalide',async()=>{
 const response=await GET(new Request('https://www.forthesoul.ch/api/events/unknown/ics'),{params:Promise.resolve({slug:'unknown'})});
 expect(response.status).toBe(404);
});
