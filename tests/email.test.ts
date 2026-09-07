import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {sendEmail} from '@/lib/email';
const mock=vi.hoisted(()=>({send:vi.fn()}));
vi.mock('resend',()=>({Resend:class {emails={send:mock.send};}}));
beforeEach(()=>{vi.stubEnv('RESEND_API_KEY','re_test_local');mock.send.mockReset();});
afterEach(()=>{vi.unstubAllEnvs();vi.restoreAllMocks();});
it('ne considère pas un refus API comme un envoi réussi',async()=>{
  mock.send.mockResolvedValue({data:null,error:{name:'validation_error',message:'test failure'}});
  expect(await sendEmail({to:'local@example.test',subject:'Test',html:'<p>Test</p>'})).toBe(false);
});
it('ne journalise pas le message ni l’adresse si l’envoi n’est pas configuré',async()=>{
  vi.stubEnv('RESEND_API_KEY','');const log=vi.spyOn(console,'info').mockImplementation(()=>{});
  await sendEmail({to:'private@example.test',subject:'Private subject',html:'Private message'});
  expect(JSON.stringify(log.mock.calls)).not.toContain('Private');expect(JSON.stringify(log.mock.calls)).not.toContain('private@');
});
it('capture les notifications dans la boîte locale uniquement en mode QA',async()=>{
  vi.stubEnv('LOCAL_MAILPIT_URL','http://127.0.0.1:54324');vi.stubEnv('QA_LOCAL','1');vi.stubEnv('VERCEL','');
  const fetch=vi.spyOn(globalThis,'fetch').mockResolvedValue(new Response(null,{status:200}));
  expect(await sendEmail({to:'test@forthesoul.test',subject:'QA',html:'<p>Test</p>'})).toBe(true);
  expect(fetch).toHaveBeenCalledWith('http://127.0.0.1:54324/api/v1/send',expect.anything());expect(mock.send).not.toHaveBeenCalled();
});
it('ne permet pas de détourner les notifications de production vers le transport QA',async()=>{
  vi.stubEnv('LOCAL_MAILPIT_URL','http://127.0.0.1:54324');vi.stubEnv('QA_LOCAL','1');vi.stubEnv('VERCEL','1');
  const fetch=vi.spyOn(globalThis,'fetch');
  expect(await sendEmail({to:'test@forthesoul.test',subject:'QA',html:'<p>Test</p>'})).toBe(false);expect(fetch).not.toHaveBeenCalled();
});
