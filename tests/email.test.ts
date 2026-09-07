import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {sendEmail} from '@/lib/email';
const mock=vi.hoisted(()=>({send:vi.fn()}));
vi.mock('resend',()=>({Resend:class {emails={send:mock.send};}}));
beforeEach(()=>{vi.stubEnv('RESEND_API_KEY','re_test_local');mock.send.mockReset();});
afterEach(()=>vi.unstubAllEnvs());
it('ne considère pas un refus API comme un envoi réussi',async()=>{
  mock.send.mockResolvedValue({data:null,error:{name:'validation_error',message:'test failure'}});
  expect(await sendEmail({to:'local@example.test',subject:'Test',html:'<p>Test</p>'})).toBe(false);
});
it('ne journalise pas le message ni l’adresse si l’envoi n’est pas configuré',async()=>{
  vi.stubEnv('RESEND_API_KEY','');const log=vi.spyOn(console,'info').mockImplementation(()=>{});
  await sendEmail({to:'private@example.test',subject:'Private subject',html:'Private message'});
  expect(JSON.stringify(log.mock.calls)).not.toContain('Private');expect(JSON.stringify(log.mock.calls)).not.toContain('private@');
});
