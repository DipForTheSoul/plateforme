import { expect, it, vi } from "vitest";
import { moderateEvent } from "@/app/actions/admin";
const state=vi.hoisted(()=>({tag:vi.fn(),fail:false}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn(),updateTag:state.tag}));
vi.mock("@/lib/auth",()=>({getCurrentProfile:async()=>({role:"admin"})}));
vi.mock("@/lib/email",()=>({sendEmail:vi.fn()}));
vi.mock("@/lib/practitioner-private",()=>({getPrivateContactEmail:async()=>undefined}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:()=>({
  select:()=>({eq:()=>({single:async()=>({data:{id:"10000000-0000-4000-8000-000000000001",title:"QA",slug:"qa",practitioner:null}})})}),
  update:()=>({or:()=>({select:async()=>({data:state.fail?[]:[{id:"10000000-0000-4000-8000-000000000001"}],error:state.fail?{}:null})})})
})})}));
it.each(["approved","rejected"])("expire immédiatement le catalogue après décision %s confirmée",async decision=>{
  state.fail=false;state.tag.mockClear();
  const data=new FormData();data.set("event_id","10000000-0000-4000-8000-000000000001");data.set("decision",decision);
  await moderateEvent(data);expect(state.tag).toHaveBeenCalledWith("public-events");
});
it("ne présente pas comme validée une écriture refusée",async()=>{
  state.fail=true;state.tag.mockClear();
  const data=new FormData();data.set("event_id","10000000-0000-4000-8000-000000000001");data.set("decision","approved");
  await expect(moderateEvent(data)).rejects.toThrow();expect(state.tag).not.toHaveBeenCalled();
});
