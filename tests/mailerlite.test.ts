import {afterEach, beforeEach, expect, it, vi} from 'vitest';
import {upsertSubscriber, upsertSubscriberDetailed} from '@/lib/mailerlite';

beforeEach(() => {
  vi.stubEnv('MAILERLITE_API_KEY', 'test-key');
  vi.stubEnv('MAILERLITE_GROUP_ID', 'test-group');
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it('confirme un upsert sans exposer la clé dans la requête utile', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{}', {status: 201}));
  vi.stubGlobal('fetch', fetchMock);
  await expect(upsertSubscriber({email: 'TEST@EXAMPLE.CH', interests: ['yoga']})).resolves.toBe(true);
  const [, options] = fetchMock.mock.calls[0];
  expect(JSON.parse(options.body)).toEqual({email: 'test@example.ch', groups: ['test-group'], fields: {interests: 'yoga'}});
});

it('retourne le motif 422 en masquant toute adresse renvoyée par MailerLite', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
    message: 'Subscriber rejected',
    errors: {email: ['contact.personnel@example.ch is unsubscribed']},
  }), {status: 422, headers: {'content-type': 'application/json'}})));
  const result = await upsertSubscriberDetailed({email: 'contact.personnel@example.ch'});
  expect(result).toMatchObject({ok: false, status: 422});
  expect(result.reason).toContain('adresse masquée@example.ch');
  expect(result.reason).not.toContain('contact.personnel');
});

it('explique une limite temporaire et une indisponibilité sans exception', async () => {
  vi.stubGlobal('fetch', vi.fn()
    .mockResolvedValueOnce(new Response('{}', {status: 429}))
    .mockResolvedValueOnce(new Response('{}', {status: 503})));
  await expect(upsertSubscriberDetailed({email: 'a@example.ch'})).resolves.toMatchObject({ok: false, status: 429, reason: expect.stringContaining('limite')});
  await expect(upsertSubscriberDetailed({email: 'b@example.ch'})).resolves.toMatchObject({ok: false, status: 503, reason: expect.stringContaining('indisponible')});
});
