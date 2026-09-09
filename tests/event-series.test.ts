import { expect, it } from 'vitest';
import { groupEventSeries } from '@/lib/event-series';
import type { EventWithRelations } from '@/types/database';
const now=Date.parse('2026-09-09T12:00:00Z');
const rows=Array.from({length:4},(_,i)=>({id:String(i),parent_event_id:i ? '0' : null,recurrence:i ? null : 'weekly',start_date:new Date(now+(i+1)*86400000).toISOString(),status:'approved',is_top:false})) as EventWithRelations[];
it('regroupe les quatre occurrences et expose leur nombre sur la carte',()=>{
  expect(groupEventSeries(rows,rows,now)).toEqual([{...rows[0],series_date_count:4}]);
});
it('respecte le filtre de date sans revenir à la première occurrence hors filtre',()=>{
  expect(groupEventSeries([rows[2],rows[3]],rows,now)).toEqual([{...rows[2],series_date_count:4}]);
});
it('ne compte ni dates passées ni dates refusées',()=>{
  expect(groupEventSeries([rows[2]],rows.map((r,i)=>i===3?{...r,status:'rejected'}:r),now+2.5*86400000)[0].series_date_count).toBe(1);
});
it('conserve la navigation vers une occurrence passée explicitement filtrée',()=>{
  expect(groupEventSeries([rows[0]],rows,now+2.5*86400000)[0].id).toBe('0');
});
