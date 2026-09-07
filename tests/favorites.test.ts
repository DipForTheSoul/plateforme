import {expect,it,vi} from 'vitest';
vi.mock('@/lib/supabase/client',()=>({createClient:()=>{throw new Error('offline-test');}}));
it('ignore un stockage corrompu qui contient une chaîne au lieu d’une liste',async()=>{
  const {getFavoriteEventIds}=await import('@/lib/favorites');
  window.localStorage.setItem('fts.fav.events','"abc"');expect(getFavoriteEventIds()).toEqual([]);
});
it('permet de garder et retirer un favori en mémoire lorsque le stockage est bloqué',async()=>{
  vi.spyOn(window,'localStorage','get').mockImplementation(()=>{throw new Error('Storage blocked');});
  const {toggleFavorite,isFavorite}=await import('@/lib/favorites');
  expect(()=>toggleFavorite('event','test-local-event')).not.toThrow();
  expect(isFavorite('event','test-local-event')).toBe(true);
  expect(toggleFavorite('event','test-local-event')).toBe(false);
});
