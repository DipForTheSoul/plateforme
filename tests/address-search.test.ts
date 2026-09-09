import {beforeEach, expect, it, vi} from 'vitest';
import {GET} from '@/app/api/address-search/route';
import {parseAddressResults, readVenuePoint} from '@/lib/address-search';
const state = vi.hoisted(() => ({profile: {id: 'qa', role: 'practitioner'} as {id: string; role: string} | null, limited: false}));
vi.mock('@/lib/auth', () => ({getCurrentProfile: async () => state.profile}));
vi.mock('@/lib/rate-limit', () => ({isRateLimited: async () => state.limited}));
const payload = {results: [{attrs: {origin: 'address', label: 'Rue Charles-GALLAND 2 <b>1206 Genève</b>', detail: 'rue charles-galland 2 1206 geneve 6621 geneve ch ge', lat: 46.19936, lon: 6.15164}}]};
const request = () => new Request('http://localhost:3100/api/address-search?q=Charles-Galland&lang=fr');
beforeEach(() => {state.profile = {id: 'qa', role: 'practitioner'}; state.limited = false;});
it('convertit la réponse suisse en texte et champs sans HTML', () => {
  expect(parseAddressResults(payload)).toEqual([{address: 'Rue Charles-GALLAND 2 1206 Genève', city: 'Genève', canton: 'GE', country: 'CH', lat: 46.19936, lng: 6.15164}]);
});
it('sert les suggestions authentifiées avec timeout et sans cache public', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json(payload)); vi.stubGlobal('fetch', fetcher);
  const response = await GET(request());
  expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toContain('no-store');
  expect((await response.json()).suggestions).toHaveLength(1);
  expect(fetcher).toHaveBeenCalledWith(expect.any(URL), expect.objectContaining({signal: expect.any(AbortSignal)}));
});
it('refuse l’accès anonyme ou participant avant tout appel fournisseur', async () => {
  const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
  state.profile = null; expect((await GET(request())).status).toBe(401);
  state.profile = {id: 'visitor', role: 'participant'}; expect((await GET(request())).status).toBe(403);
  expect(fetcher).not.toHaveBeenCalled();
});
it('borne requêtes, quotas, pannes et réponses invalides', async () => {
  expect((await GET(new Request('http://localhost/api/address-search?q=ab'))).status).toBe(400);
  state.limited = true; expect((await GET(request())).status).toBe(429); state.limited = false;
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('timeout'))); expect((await GET(request())).status).toBe(503);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({results: 'broken'}))); expect((await GET(request())).status).toBe(503);
});
it('ne transforme pas des coordonnées vides en zéro et refuse les paires corrompues', () => {
  const form = new FormData(); expect(readVenuePoint(form)).toBeNull();
  form.set('lat', '46'); expect(() => readVenuePoint(form)).toThrow();
  form.set('lng', '999'); expect(() => readVenuePoint(form)).toThrow();
  form.set('lng', '6'); expect(readVenuePoint(form)).toEqual({lat:46, lng:6});
});
