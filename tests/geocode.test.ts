import {expect,it,vi} from 'vitest';
import {geocodeAddress} from '@/lib/geocode';
vi.mock('server-only',()=>({}));
it('refuse des coordonnées corrompues sans les enregistrer',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:true,json:async()=>[{lat:'NaN',lon:'999',display_name:'Invalid'}]})));
  expect(await geocodeAddress('Adresse test invalide')).toBeNull();
});
it('borne la durée de la requête de géocodage',async()=>{
  const fetchMock=vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify([{lat:'46.2',lon:'6.1',display_name:'Test'}])));vi.stubGlobal('fetch',fetchMock);
  expect(await geocodeAddress('Adresse test valide','CH')).toEqual({lat:46.2,lng:6.1,displayName:'Test'});
  expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({signal:expect.any(AbortSignal)}));
});
