// @vitest-environment node
import {beforeEach, expect, it, vi} from 'vitest';
import {NextRequest} from 'next/server';
import {POST} from '@/app/api/stripe/featured-checkout/route';

const mocks=vi.hoisted(()=>({configured:vi.fn(),create:vi.fn(),user:vi.fn(),event:vi.fn(),settings:vi.fn()}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({from:()=>({select:()=>({in:mocks.settings})})})}));
vi.mock('@/lib/stripe',()=>({isStripeConfigured:mocks.configured,getStripe:()=>({checkout:{sessions:{create:mocks.create}}})}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({
  auth:{getUser:mocks.user},
  from:(table:string)=>{
    if(table==='settings')return {select:()=>({in:mocks.settings})};
    if(table==='profiles')return {select:()=>({eq:()=>({maybeSingle:async()=>({data:{preferred_lang:'fr'}})})})};
    const chain={select:()=>chain,eq:()=>chain,is:()=>chain,maybeSingle:mocks.event};
    return chain;
  },
})}));

const request=(body:string)=>new NextRequest('http://localhost/api/stripe/featured-checkout',{method:'POST',headers:{'content-type':'application/json'},body});
const eventId='10000000-0000-4000-8000-000000000001';

beforeEach(()=>{
  vi.clearAllMocks();mocks.configured.mockReturnValue(true);mocks.user.mockResolvedValue({data:{user:{id:'user',email:'p@example.ch'}}});
  mocks.event.mockResolvedValueOnce({data:{id:'20000000-0000-4000-8000-000000000001',name:'Praticien'}}).mockResolvedValueOnce({data:{id:eventId,title:'Offre'},error:null});
  mocks.settings.mockResolvedValue({data:[{key:'featured_price_chf',value:'20'},{key:'featured_default_days',value:'30'}],error:null});
  mocks.create.mockResolvedValue({url:'https://checkout.stripe.com/featured'});
});

it('utilise exclusivement le prix et la durée du serveur',async()=>{
  const response=await POST(request(JSON.stringify({eventId,price:1,days:999})));
  expect(response.status).toBe(200);
  expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
    metadata:expect.objectContaining({kind:'featured_event',event_id:eventId,duration_days:'30',amount_chf:'20'}),
    line_items:[expect.objectContaining({price_data:expect.objectContaining({unit_amount:2000,currency:'chf'})})],
    success_url:expect.stringContaining('mise_en_avant=succes'),
  }));
});

it('refuse un identifiant arbitraire avant Stripe',async()=>{expect((await POST(request('{"eventId":"bad"}'))).status).toBe(400);expect(mocks.create).not.toHaveBeenCalled();});
it('reprend un tarif modifié et ne facture pas le montant par défaut',async()=>{
  mocks.settings.mockResolvedValue({data:[{key:'featured_price_chf',value:'27.5'},{key:'featured_default_days',value:'45'}],error:null});
  expect((await POST(request(JSON.stringify({eventId})))).status).toBe(200);
  expect(mocks.create.mock.calls[0][0].line_items[0].price_data.unit_amount).toBe(2750);
  expect(mocks.create.mock.calls[0][0].metadata.duration_days).toBe('45');
});
it('ne remplace pas un tarif manquant par 20 CHF',async()=>{
  mocks.settings.mockResolvedValue({data:[],error:null});
  expect((await POST(request(JSON.stringify({eventId})))).status).toBe(503);
  expect(mocks.create).not.toHaveBeenCalled();
});
it('refuse une offre non détenue ou non publiée',async()=>{mocks.event.mockReset().mockResolvedValueOnce({data:{id:'20000000-0000-4000-8000-000000000001',name:'Praticien'}}).mockResolvedValueOnce({data:null,error:null});expect((await POST(request(JSON.stringify({eventId})))).status).toBe(403);expect(mocks.create).not.toHaveBeenCalled();});
