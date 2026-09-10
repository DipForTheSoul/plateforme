import {beforeEach,it,expect,vi} from 'vitest';
import {adminUpdateVenue} from '@/app/actions/venues';
const state=vi.hoisted(()=>({role:'admin',update:vi.fn(),geo:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({getCurrentProfile:async()=>({role:state.role})}));
vi.mock('@/lib/geocode',()=>({geocodeAddress:state.geo}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>({
  select:()=>({eq:()=>({maybeSingle:async()=>({data:{address:'Place de la Gare 1',country:'CH',lat:46,lng:6,contact:{}}})})}),
  update:state.update,
})})}));
beforeEach(()=>{state.role='admin';state.update.mockReset().mockReturnValue({eq:async()=>({error:null})});});
function form(value?:string){const fd=new FormData();fd.set('name','Lieu exemple');fd.set('address','Place de la Gare 1');fd.set('country','CH');if(value!==undefined)fd.set('is_public',value);return fd;}
it('publie uniquement sur choix explicite administrateur',async()=>{
  expect(await adminUpdateVenue('id',{},form('true'))).toHaveProperty('success');
  expect(state.update).toHaveBeenCalledWith(expect.objectContaining({is_public:true,review_status:'approved'}));
});
it('permet de retirer de l’annuaire sans supprimer le lieu ni invalider son adresse',async()=>{
  await adminUpdateVenue('id',{},form('false'));
  expect(state.update.mock.calls[0][0]).toMatchObject({is_public:false});
  expect(state.update.mock.calls[0][0]).not.toHaveProperty('review_status');
});
it('préserve le statut lors de la soumission d’un ancien formulaire',async()=>{
  await adminUpdateVenue('id',{},form());
  expect(state.update.mock.calls[0][0]).not.toHaveProperty('is_public');
});
it('refuse le praticien et une valeur invalide sans mutation',async()=>{
  state.role='practitioner';expect(await adminUpdateVenue('id',{},form('true'))).toHaveProperty('error');
  state.role='admin';expect(await adminUpdateVenue('id',{},form('unexpected'))).toHaveProperty('error');
  expect(state.update).not.toHaveBeenCalled();
});
