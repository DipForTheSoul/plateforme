import {beforeEach,expect,it,vi} from "vitest";
import {sendPractitionerContact} from "@/app/actions/practitioner-contact";

const state=vi.hoisted(()=>({limited:false,sent:true,inserts:[] as Record<string,unknown>[],updates:[] as Record<string,unknown>[],email:null as null|Record<string,unknown>}));
vi.mock("next/headers",()=>({headers:async()=>new Headers({"x-forwarded-for":"192.0.2.4"})}));
vi.mock("@/lib/rate-limit",()=>({hashRequestIdentity:()=>"a".repeat(64),isRateLimited:async()=>state.limited}));
vi.mock("@/lib/email",()=>({sendEmail:async(input:Record<string,unknown>)=>{state.email=input;return state.sent;}}));
vi.mock("@/lib/supabase/admin",()=>({createAdminClient:()=>({from:(table:string)=>{
  const builder={
    select:()=>builder,eq:()=>builder,
    maybeSingle:async()=>table==="practitioners"?{data:{id:"11111111-1111-4111-8111-111111111111",user_id:"22222222-2222-4222-8222-222222222222",name:"Praticienne QA",contact:{},status:"approved"},error:null}:{data:{email:"practice@example.test",preferred_lang:"en"},error:null},
    insert:(value:Record<string,unknown>)=>{state.inserts.push(value);return {select:()=>({single:async()=>({data:{id:"33333333-3333-4333-8333-333333333333"},error:null})})};},
    update:(value:Record<string,unknown>)=>{state.updates.push(value);return {eq:async()=>({error:null})};},
  };return builder;
}})}));

function form(overrides:Record<string,string>={}){const data={practitioner_id:"11111111-1111-4111-8111-111111111111",name:"Visitor QA",email:"visitor@example.test",phone:"",message:"A useful local test enquiry.",contact_consent:"on",newsletter_consent:"on",website:"",locale:"fr",...overrides};const f=new FormData();for(const [key,value] of Object.entries(data))f.set(key,value);return f;}
beforeEach(()=>{state.limited=false;state.sent=true;state.inserts=[];state.updates=[];state.email=null;});

it("stores the request and sends it with the visitor as reply-to",async()=>{const result=await sendPractitionerContact({status:"idle"},form());expect(result.status).toBe("success");expect(state.inserts[0]).toMatchObject({newsletter_consent:true,send_status:"pending",ip_hash:"a".repeat(64)});expect(state.email).toMatchObject({to:"practice@example.test",replyTo:"visitor@example.test"});expect(state.updates.at(-1)).toMatchObject({send_status:"sent",send_error:null});});
it("keeps a failed delivery for admin follow-up",async()=>{state.sent=false;expect(await sendPractitionerContact({status:"idle"},form())).toEqual({status:"error",code:"sendFailed"});expect(state.updates.at(-1)).toMatchObject({send_status:"failed",send_error:"transactional_email_failed"});});
it("blocks the sixth request indicated by the shared hourly limiter",async()=>{state.limited=true;expect(await sendPractitionerContact({status:"idle"},form())).toEqual({status:"error",code:"rateLimited"});expect(state.inserts).toHaveLength(0);});
it("blocks a filled honeypot before storage",async()=>{expect(await sendPractitionerContact({status:"idle"},form({website:"spam.example"}))).toEqual({status:"error",code:"invalid"});expect(state.inserts).toHaveLength(0);});
