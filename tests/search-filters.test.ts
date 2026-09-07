import { it, expect } from 'vitest';
import { parseSearchFilters } from '@/lib/search-filters';
it('ignore les dates/coordonnées invalides sans planter le catalogue',()=>{
  expect(()=>parseSearchFilters({du:'pas-une-date',au:'2026-02-30',lat:'Infinity',lng:'999',rayon:'-1'})).not.toThrow();
  expect(parseSearchFilters({du:'bad',lat:'Infinity'}).dateFrom).toBeUndefined();
  expect(parseSearchFilters({lat:'Infinity'}).lat).toBeUndefined();
});
it('inclut toute la journée suisse, y compris le soir et les changements d’heure',()=>{
  const filters=parseSearchFilters({du:'2026-10-25'});
  expect(filters.dateFrom).toBe('2026-10-24T22:00:00.000Z');
  expect(filters.dateTo).toBe('2026-10-25T22:59:59.999Z');
});
