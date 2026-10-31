import {beforeEach,expect,it,vi} from 'vitest';
const s=vi.hoisted(()=>({signup:vi.fn(),update:vi.fn(),role:'admin',practitioner:true}));
vi.mock('next/headers',()=>({headers:async()=>new Headers()}));
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/lib/rate-limit',()=>({isRateLimited:async()=>false}));
vi.mock('@/lib/auth',()=>({getCurrentPractitioner:async()=>s.practitioner?{id:'fixture',slug:'fixture',status:'approved',links:{}}:null,getCurrentProfile:async()=>({role:s.role})}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:vi.fn()}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{signUp:s.signup},from:()=>{
 const q={select:()=>q,eq:()=>q,maybeSingle:async()=>({data:{slug:'fixture',links:{}}}),update:(value:unknown)=>{s.update(value);return q;},then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({error:null}).then(resolve)};
 return q;
}})}));
import {signUp} from '@/app/actions/auth';
import {updatePractitionerProfile,adminUpdatePractitioner} from '@/app/actions/practitioner';
const form=(values:Record<string,string>)=>{const f=new FormData();Object.entries(values).forEach(([k,v])=>f.set(k,v));return f;};
const signup=()=>form({email:'fixture@example.test',password:'Fixture-only-123',passwordConfirm:'Fixture-only-123',role:'practitioner',firstName:'Test',lastName:'Fixture',artistName:'Test Fixture',bio:'Eine ausreichend lange Biografie für einen isolierten Test.',specialties:'Yoga',locale:'de'});
const profile=()=>form({name:'Test Fixture',bio:'Biographie conservée',locale:'de'});
beforeEach(()=>{vi.clearAllMocks();s.role='admin';s.practitioner=true;s.signup.mockResolvedValue({error:null});});
it.each(['monsite.ch','www.monsite.ch','https://monsite.ch'])('accepts the signup website %s and normalizes it before Auth',async website=>{
 const f=signup();f.set('website',website);f.set('instagram','instagram.com/fixture');
 expect(await signUp({},f)).toEqual({success:'checkEmail'});
 const sent=s.signup.mock.calls[0][0].options.data;
 expect(sent.website).toMatch(/^https:\/\/(www\.)?monsite\.ch\/$/);expect(sent.instagram).toBe('https://instagram.com/fixture');
});
it('leaves optional links empty without requiring a website',async()=>{
 expect(await signUp({},signup())).toEqual({success:'checkEmail'});expect(s.signup.mock.calls[0][0].options.data.website).toBeNull();
});
it.each(['javascript:alert(1)','data:text/html,test','https://name:secret@example.ch','bad address'])('rejects unsafe or invalid links %s before Auth',async website=>{
 const f=signup();f.set('website',website);const result=await signUp({},f);
 expect(result.fieldErrors?.website).toContain('Webadresse');expect(s.signup).not.toHaveBeenCalled();
});
it('identifies a long signup bio instead of accusing the website',async()=>{
 const f=signup();f.set('bio','a'.repeat(1001));const result=await signUp({},f);
 expect(result.fieldErrors?.bio).toContain('1.000');expect(result.fieldErrors?.website).toBeUndefined();expect(s.signup).not.toHaveBeenCalled();
});
it('accepts an exact-limit signup bio and optional bare links',async()=>{
 const f=signup();f.set('bio','a'.repeat(1000));expect(await signUp({},f)).toEqual({success:'checkEmail'});
});
it('identifies an overlong profile biography without saving',async()=>{
 const f=profile();f.set('bio','a'.repeat(4001));const result=await updatePractitionerProfile({},f);
 expect(result.fieldErrors?.bio).toContain('4.000');expect(result.error).not.toContain('URL');expect(s.update).not.toHaveBeenCalled();
});
it('returns the same precise biography error in admin editing',async()=>{
 const f=profile();f.set('bio','a'.repeat(4001));const result=await adminUpdatePractitioner('fixture',{},f);
 expect(result.fieldErrors?.bio).toContain('4.000');expect(s.update).not.toHaveBeenCalled();
});
it('saves an exact-limit biography and normalizes the profile link',async()=>{
 const f=profile();f.set('bio','a'.repeat(4000));f.set('website','monsite.ch');
 expect(await updatePractitionerProfile({},f)).toHaveProperty('success');expect(s.update.mock.calls[0][0].bio).toHaveLength(4000);expect(s.update.mock.calls[0][0].contact.website).toBe('https://monsite.ch/');
});
it('retains the admin authorization guard',async()=>{
 s.role='practitioner';expect(await adminUpdatePractitioner('fixture',{},profile())).toEqual({error:"Réservé à l'administrateur."});expect(s.update).not.toHaveBeenCalled();
});
