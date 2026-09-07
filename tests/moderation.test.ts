import {expect,it,vi} from 'vitest';
import {moderateEvent, toggleTopListing, extendFeatured} from '@/app/actions/admin';
const mocks=vi.hoisted(()=>({email:vi.fn()}));
vi.mock('@/lib/auth',()=>({getCurrentProfile:async()=>({role:'admin'})}));
vi.mock('@/lib/email',()=>({sendEmail:mocks.email}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({from:()=>({
  select:()=>({eq:()=>({single:async()=>({data:{id:'10000000-0000-4000-8000-000000000001',title:'Test',slug:'test',practitioner:{name:'Test',contact:{email:'local@example.test'},user_id:'local'}}}),maybeSingle:async()=>({data:{preferred_lang:'fr'}})})}),
  update:()=>({eq:()=>({error:{message:'Database failure'},select:async()=>({error:{message:'Database failure'}})}),or:()=>({select:async()=>({error:{message:'Database failure'}})})})
})})}));
it('n’annonce pas une publication si sa mise à jour en base a échoué',async()=>{
  const fd=new FormData();fd.set('event_id','10000000-0000-4000-8000-000000000001');fd.set('decision','approved');
  await expect(moderateEvent(fd)).rejects.toThrow();expect(mocks.email).not.toHaveBeenCalled();
});
it.each([toggleTopListing,extendFeatured])('signale une mise en avant non enregistrée',async action=>{
  const fd=new FormData();fd.set('event_id','10000000-0000-4000-8000-000000000001');
  await expect(action(fd)).rejects.toThrow();
});
