import { eventLocalToIso } from './event-time';
import type { EventFilters } from './queries';

export function parseSearchFilters(sp: Record<string,string | string[] | undefined>): EventFilters {
  const text = (key:string) => typeof sp[key] === 'string' ? sp[key] as string : undefined;
  const number = (key:string,min:number,max:number) => { const value=text(key); if(!value)return undefined; const n=Number(value); return Number.isFinite(n)&&n>=min&&n<=max?n:undefined; };
  const day = (value:string|undefined,end=false) => { if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined; try { const iso=eventLocalToIso(value+(end?'T23:59':'T00:00'));return end?new Date(Date.parse(iso)+59999).toISOString():iso; } catch { return undefined; } };
  const from=day(text('du'));
  const until=day(text('au') || text('du'),true);
  return {q:text('q')?.slice(0,200),category:text('categorie'),language:text('langue'),practitioner:text('praticien'),
    country:text('pays'),canton:text('canton'),priceMax:number('prix',0,99999999),durationMax:number('duree',1,525600),
    dateFrom:from,dateTo:until && (!from || until>=from)?until:undefined,
    lat:number('lat',-90,90),lng:number('lng',-180,180),radiusKm:number('rayon',1,1000)};
}
