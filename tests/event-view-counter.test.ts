import {afterEach,beforeEach,expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({headers:new Headers(),rpc:vi.fn(),create:vi.fn(),abort:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/headers',()=>({headers:async()=>state.headers}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:state.create}));
import {recordEventView} from '@/lib/event-view-counter';
beforeEach(()=>{
 vi.clearAllMocks();state.headers=new Headers({'user-agent':'Mozilla/5.0 Chrome/155.0.0.0'});
 state.abort.mockResolvedValue({error:null});state.rpc.mockReturnValue({abortSignal:state.abort});
 state.create.mockReturnValue({rpc:state.rpc});vi.spyOn(console,'warn').mockImplementation(()=>{});
});
afterEach(()=>{vi.restoreAllMocks();vi.unstubAllEnvs();});
it('uses only the narrow server RPC with a bounded timeout',async()=>{
 await recordEventView('fixture-event');expect(state.rpc).toHaveBeenCalledExactlyOnceWith('increment_event_view',{p_event_id:'fixture-event'});
 expect(state.abort.mock.calls[0][0]).toBeInstanceOf(AbortSignal);
});
it.each(['meta-externalagent/1.1','Googlebot/2.1','Lightpanda/1.0'])('does not count identified bot %s',async(ua)=>{
 state.headers.set('user-agent',ua);await recordEventView('fixture');expect(state.create).not.toHaveBeenCalled();
});
it.each([['purpose','prefetch'],['sec-purpose','prefetch;prerender'],['next-router-prefetch','1']])('does not count prefetch %s',async(key,value)=>{
 state.headers.set(key,value);await recordEventView('fixture');expect(state.create).not.toHaveBeenCalled();
});
it('does not count preview traffic',async()=>{vi.stubEnv('VERCEL_ENV','preview');await recordEventView('fixture');expect(state.create).not.toHaveBeenCalled();});
it('handles rpc.error without breaking render and recovers next request',async()=>{
 state.abort.mockResolvedValueOnce({error:{message:'sensitive SQL details'}});
 await expect(recordEventView('fixture')).resolves.toBeUndefined();expect(console.warn).toHaveBeenCalledExactlyOnceWith('Event view counter unavailable');
 await recordEventView('fixture');expect(state.rpc).toHaveBeenCalledTimes(2);expect(console.warn).toHaveBeenCalledTimes(1);
});
it('handles provider rejection without disclosing its message',async()=>{
 state.abort.mockRejectedValueOnce(new Error('private backend details'));
 await expect(recordEventView('fixture')).resolves.toBeUndefined();expect(console.warn).toHaveBeenCalledExactlyOnceWith('Event view counter unavailable');
});
it('handles absent service configuration as a secondary failure',async()=>{
 state.create.mockImplementationOnce(()=>{throw new Error('secret configuration')});
 await expect(recordEventView('fixture')).resolves.toBeUndefined();expect(console.warn).toHaveBeenCalledExactlyOnceWith('Event view counter unavailable');
});
