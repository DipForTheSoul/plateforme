import { expect, it, vi } from 'vitest';
import { findPublicVenue, venuePublicSlug } from '@/lib/venue-public-slug';
import { getVenueByPublicSlug } from '@/lib/queries';
import sitemap from '@/app/sitemap';

const venues = vi.hoisted(() => [
  {id:'bc1c3f94-7783-4c75-8489-823f4baa2291',name:'evolutionclub',slug:'evolutionclub',is_public:true,review_status:'approved'},
  {id:'0e75235f-856f-4d4f-9706-5f144069ae37',name:'Privé',is_public:false,review_status:'approved'},
  {id:'5d0404df-ed1a-4659-b1b3-72088c9364c6',name:'À valider',is_public:true,review_status:'pending'},
]);
vi.mock('@/lib/supabase/public', () => ({createPublicClient:()=>({from:(table:string)=>{
  const q={select:()=>q,order:()=>q,eq:()=>q,range:()=>q,then:(r:(v:unknown)=>unknown)=>r({data:table==='venues'?venues:[],error:null})};return q;
}})}));

it('forme une adresse lisible, stable et bornée pour les lieux nouveaux ou existants',()=>{
  expect(venuePublicSlug(venues[0])).toBe('evolutionclub');
  expect(venuePublicSlug({...venues[0],name:'é'.repeat(200),slug:null}).length).toBeLessThanOrEqual(73);
});
it('conserve les UUID et les anciens noms sans accepter une identité ambiguë',()=>{
  const renamed={...venues[0],name:'Nouveau nom'};
  expect(findPublicVenue([renamed],venues[0].id)?.id).toBe(renamed.id);
  expect(findPublicVenue([renamed],'evolutionclub-bc1c3f942291')?.name).toBe('Nouveau nom');
  expect(findPublicVenue([renamed,{...renamed,id:'bc1c3f94-0000-4000-8000-000000002291'}],'evolutionclub-bc1c3f942291')).toBeNull();
  expect(findPublicVenue([renamed],'inconnu')).toBeNull();
});
it('résout les deux formats uniquement pour les lieux publics approuvés',async()=>{
  expect((await getVenueByPublicSlug(venues[0].id))?.id).toBe(venues[0].id);
  expect((await getVenueByPublicSlug(venuePublicSlug(venues[0])))?.id).toBe(venues[0].id);
  for(const v of venues.slice(1)){
    expect(await getVenueByPublicSlug(v.id)).toBeNull();
    expect(await getVenueByPublicSlug(venuePublicSlug(v))).toBeNull();
  }
});
it('n’ajoute au sitemap que les lieux publiés avec leurs adresses et langues cohérentes',async()=>{
  const entries=(await sitemap()).filter(e=>e.url.includes('/lieux/'));
  expect(entries).toHaveLength(1);
  expect(entries[0].url).toMatch(/\/lieux\/evolutionclub$/);
  expect(entries[0].alternates?.languages?.de).toMatch(/\/de\/orte\/evolutionclub$/);
});
it('distingue les lieux importés partageant le même préfixe UUID même après renommage',()=>{
  const a={id:'b0000000-0000-4000-8000-000000000006',name:'Studio'};
  const b={id:'b0000000-0000-4000-8000-000000000009',name:'Kraftwerk'};
  expect(venuePublicSlug(a)).not.toBe(venuePublicSlug(b));
  expect(findPublicVenue([{...a,name:'Nouveau Studio'},b],'studio-b00000000006')?.id).toBe(a.id);
});

it('garde l’adresse courte enregistrée après renommage et distingue les homonymes',()=>{
 const a={...venues[0],name:'Nouveau nom'};
 const b={...venues[0],id:'other',slug:'evolutionclub-2'};
 expect(venuePublicSlug(a)).toBe('evolutionclub');
 expect(findPublicVenue([a,b],'evolutionclub')?.id).toBe(a.id);
 expect(findPublicVenue([a,b],'evolutionclub-2')?.id).toBe(b.id);
});
