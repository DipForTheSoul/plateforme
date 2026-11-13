import {beforeEach, expect, it, vi} from 'vitest';
import {createVenue} from '@/app/actions/venues';
const mocks = vi.hoisted(() => ({insert:vi.fn(), geocode:vi.fn(), user: {id:'qa'}}));
vi.mock('next/cache', () => ({revalidatePath:vi.fn(),updateTag:vi.fn()}));
vi.mock('@/lib/auth', () => ({getCurrentProfile: async () => ({id:'qa', role:'practitioner'})}));
vi.mock('@/lib/geocode', () => ({geocodeAddress:mocks.geocode}));
vi.mock('@/lib/supabase/server', () => ({createClient:async () => ({auth:{getUser:async () => ({data:{user:mocks.user}})}, from:() => ({insert:mocks.insert})})}));
beforeEach(() => {mocks.insert.mockReturnValue({select:() => ({single:async () => ({data:{id:'venue-qa'}})})}); mocks.geocode.mockReset();});
function form(mode = 'manual') {const data = new FormData();Object.entries({name:'Lieu QA',address:'Adresse manuelle à vérifier',city:'Genève',country:'CH',address_mode:mode}).forEach(([k,v]) => data.set(k,v));return data;}
it('enregistre une adresse manuelle sans appel géographique et sans publication', async () => {
  expect(await createVenue({}, form())).toMatchObject({venueId:'venue-qa'});
  expect(mocks.geocode).not.toHaveBeenCalled();
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({lat:null,lng:null,review_status:'pending'}));
});
it('utilise les coordonnées sélectionnées et conserve la validation de Didier', async () => {
  const data = form('automatic');data.set('lat','46.2');data.set('lng','6.1');
  await createVenue({},data);
  expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({lat:46.2,lng:6.1,review_status:'pending'}));
  expect(mocks.geocode).not.toHaveBeenCalled();
});
it('inclut la ville dans le géocodage historique et conserve l’erreur sans créer', async () => {
  mocks.geocode.mockResolvedValue(null); mocks.insert.mockClear();
  expect(await createVenue({},form('automatic'))).toHaveProperty('error');
  expect(mocks.geocode).toHaveBeenCalledWith('Adresse manuelle à vérifier, Genève','CH');
  expect(mocks.insert).not.toHaveBeenCalled();
});

it('essaie une adresse courte numérotée uniquement si le nom existe déjà',async()=>{
 mocks.insert.mockReset().mockReturnValueOnce({select:()=>({single:async()=>({data:null,error:{code:'23505',message:'venues_public_slug_unique'}})})}).mockReturnValue({select:()=>({single:async()=>({data:{id:'new-venue'},error:null})})});
 expect(await createVenue({},form())).toHaveProperty('venueId','new-venue');
 expect(mocks.insert.mock.calls[0][0].slug).toBe('lieu-qa');
 expect(mocks.insert.mock.calls[1][0].slug).toBe('lieu-qa-2');
});
