// @vitest-environment node
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/stripe/webhook/route';
const mocks=vi.hoisted(()=>({construct:vi.fn(),rpc:vi.fn()}));
vi.mock('@/lib/stripe',()=>({getStripe:()=>({webhooks:{constructEvent:mocks.construct}})}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({rpc:mocks.rpc})}));
const fixture=(type='checkout.session.completed',status='paid',credits='5')=>({type,data:{object:{id:'cs_test_local',payment_status:status,metadata:{practitioner_id:'20000000-0000-4000-8000-000000000001',credits}}}});
const request=(signature=true)=>new NextRequest('http://localhost/api/stripe/webhook',{method:'POST',body:'raw-body',headers:signature?{'stripe-signature':'test-signature'}:{}});
beforeEach(()=>{vi.stubEnv('STRIPE_WEBHOOK_SECRET','whsec_test_local');mocks.rpc.mockReset().mockResolvedValue({data:true,error:null});mocks.construct.mockReset().mockReturnValue(fixture());});
afterEach(()=>vi.unstubAllEnvs());
it('refuse une signature absente',async()=>{expect((await POST(request(false))).status).toBe(400);expect(mocks.rpc).not.toHaveBeenCalled();});
it('refuse une signature invalide',async()=>{mocks.construct.mockImplementation(()=>{throw new Error('signature');});expect((await POST(request())).status).toBe(400);expect(mocks.rpc).not.toHaveBeenCalled();});
it('ne crédite jamais une session impayée',async()=>{mocks.construct.mockReturnValue(fixture(undefined,'unpaid'));await POST(request());expect(mocks.rpc).not.toHaveBeenCalled();});
it('traite un paiement différé confirmé',async()=>{mocks.construct.mockReturnValue(fixture('checkout.session.async_payment_succeeded'));expect((await POST(request())).status).toBe(200);expect(mocks.rpc).toHaveBeenCalledWith('add_credits',expect.objectContaining({p_amount:5,p_stripe_session_id:'cs_test_local'}));});
it('refuse des crédits partiellement numériques',async()=>{mocks.construct.mockReturnValue(fixture(undefined,undefined,'5bad'));await POST(request());expect(mocks.rpc).not.toHaveBeenCalled();});
it('renvoie 500 si la base échoue pour permettre la relivraison Stripe',async()=>{mocks.rpc.mockResolvedValue({error:{message:'test outage'}});expect((await POST(request())).status).toBe(500);});
it('accepte un événement déjà traité sans nouveau crédit côté SQL',async()=>{mocks.rpc.mockResolvedValue({data:false,error:null});expect((await POST(request())).status).toBe(200);});
