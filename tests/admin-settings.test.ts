import { beforeEach, expect, it, vi } from 'vitest';
import { updateSettings } from '@/app/actions/settings';
const mocks = vi.hoisted(() => ({upsert:vi.fn(), profile:vi.fn()}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/auth',()=>({getCurrentProfile:mocks.profile}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>({upsert:mocks.upsert})})}));
beforeEach(()=>{mocks.upsert.mockReset().mockResolvedValue({error:null}); mocks.profile.mockResolvedValue({role:'admin'});});
it('ne supprime pas une promotion en modifiant uniquement une durée',async()=>{
  const fd=new FormData();fd.set('featured_default_days','30');
  expect((await updateSettings({},fd)).success).toBeTruthy();
  expect(mocks.upsert.mock.calls[0][0].map((r:{key:string})=>r.key)).toEqual(['featured_default_days']);
});
it.each([['exchange_rate_eur','Infinity'],['price_pack_1','-5'],['featured_default_days','2.5'],['event_delist_days','NaN']])('refuse %s=%s',async(key,value)=>{
  const fd=new FormData();fd.set(key,value);
  expect((await updateSettings({},fd)).error).toBeTruthy();expect(mocks.upsert).not.toHaveBeenCalled();
});
it('autorise l’effacement explicite d’une promotion',async()=>{
  const fd=new FormData();fd.set('promo_label','');fd.set('promo_discount_percent','');
  expect((await updateSettings({},fd)).success).toBeTruthy();
  expect(mocks.upsert.mock.calls[0][0]).toHaveLength(2);
});
it('refuse un compte non administrateur',async()=>{
  mocks.profile.mockResolvedValue({role:'practitioner'});
  expect((await updateSettings({},new FormData())).error).toBeTruthy();expect(mocks.upsert).not.toHaveBeenCalled();
});
