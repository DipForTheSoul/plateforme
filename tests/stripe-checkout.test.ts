// @vitest-environment node
import {beforeEach, expect, it, vi} from 'vitest';
import {NextRequest} from 'next/server';
import {POST} from '@/app/api/stripe/checkout/route';
const mocks=vi.hoisted(()=>({configured:vi.fn(),create:vi.fn(),user:vi.fn(),settings:vi.fn()}));
vi.mock('@/lib/stripe',()=>({isStripeConfigured:mocks.configured,getStripe:()=>({checkout:{sessions:{create:mocks.create}}})}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:mocks.user},from:(table:string)=>({select:()=> table==='settings'?mocks.settings():{eq:()=>({maybeSingle:async()=>({data:table==='profiles'?{preferred_lang:'de'}:{id:'20000000-0000-4000-8000-000000000001',name:'Test'}})})}})})}));
const request=(body:string)=>new NextRequest('http://localhost/api/stripe/checkout',{method:'POST',headers:{'content-type':'application/json'},body});
beforeEach(()=>{vi.clearAllMocks();mocks.configured.mockReturnValue(true);mocks.create.mockResolvedValue({url:'https://checkout.stripe.com/test-local'});mocks.user.mockResolvedValue({data:{user:{id:'test',email:'test@example.com'}}});mocks.settings.mockResolvedValue({data:[],error:null});});
it('ne crée pas de session quand Stripe est absent',async()=>{mocks.configured.mockReturnValue(false);expect((await POST(request('{}'))).status).toBe(503);expect(mocks.create).not.toHaveBeenCalled();});
it('exige une session utilisateur',async()=>{mocks.user.mockResolvedValue({data:{user:null}});expect((await POST(request('{}'))).status).toBe(401);});
it.each(['{','null','{"packId":123}','{"packId":"bad"}'])('refuse une requête invalide %s sans erreur 500',async body=>{expect((await POST(request(body))).status).toBe(400);expect(mocks.create).not.toHaveBeenCalled();});
it('ne facture pas un prix de secours en cas de panne des paramètres',async()=>{mocks.settings.mockResolvedValue({data:null,error:{message:'offline'}});expect((await POST(request('{"packId":"pack-5"}'))).status).toBe(503);expect(mocks.create).not.toHaveBeenCalled();});
it('utilise le prix serveur et conserve la langue de retour',async()=>{mocks.settings.mockResolvedValue({data:[{key:'price_pack_5',value:'120'}],error:null});expect((await POST(request('{"packId":"pack-5","amount":1,"credits":999}'))).status).toBe(200);expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({locale:'de',metadata:expect.objectContaining({credits:'5'}),success_url:expect.stringContaining('/de/espace-praticien/credits?achat=succes'),line_items:[expect.objectContaining({price_data:expect.objectContaining({unit_amount:12000})})]}));});
it('refuse un montant inférieur au minimum',async()=>{mocks.settings.mockResolvedValue({data:[{key:'price_pack_5',value:'0.1'}],error:null});expect((await POST(request('{"packId":"pack-5"}'))).status).toBe(503);expect(mocks.create).not.toHaveBeenCalled();});
it('ne transmet pas le détail privé d’une erreur Stripe au navigateur',async()=>{mocks.create.mockRejectedValue(new Error('private-provider-detail'));const response=await POST(request('{"packId":"pack-5"}'));expect(response.status).toBe(502);expect(await response.text()).not.toContain('private-provider-detail');});
