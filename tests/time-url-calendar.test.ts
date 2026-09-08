import { describe, it, expect } from 'vitest';
import { eventLocalToIso, shiftEventDate, toEventLocalInput, eventCalendarDaySpan } from '@/lib/event-time';
import { webUrlSchema } from '@/lib/web-url';
import { parseEventForm, occurrenceSchedule } from '@/lib/event-input';
import { buildICS } from '@/lib/calendar';
import { formatEventSchedule, eventInclusiveDays } from '@/lib/event-display';

it('présente les deux dates et heures suisses du séjour avec deux jours inclusifs', () => {
  expect(formatEventSchedule('2026-10-17T08:00:00Z', '2026-10-18T14:00:00Z', 'fr')).toMatch(/17\.10\.2026.*10:00.*18\.10\.2026.*16:00/);
  expect(eventInclusiveDays('2026-10-17T08:00:00Z', '2026-10-18T14:00:00Z')).toBe(2);
  expect(eventInclusiveDays('2026-10-24T08:00:00Z', '2026-10-25T15:00:00Z')).toBe(2);
  expect(eventInclusiveDays('2026-10-31T09:00:00Z', '2026-11-01T15:00:00Z')).toBe(2);
});

describe('Heures suisses indépendantes du serveur et du navigateur',()=>{
  it.each(['2026-01-10T11:00','2026-06-10T11:00','2026-10-25T00:15','2026-03-29T03:30','2026-12-31T23:59'])('aller-retour %s',local=>expect(toEventLocalInput(eventLocalToIso(local))).toBe(local));
  it.each(['','not-a-date','2026-02-30T11:00','2026-01-10T25:00','2026-03-29T02:30'])('rejette %s',local=>expect(()=>eventLocalToIso(local)).toThrow());
  it('garde 11 h entre été et hiver',()=>expect(toEventLocalInput(shiftEventDate(eventLocalToIso('2026-10-18T11:00'),'weekly',1))).toBe('2026-10-25T11:00'));
  it('garde le dernier jour disponible en février sans déborder sur mars',()=>expect(toEventLocalInput(shiftEventDate(eventLocalToIso('2026-01-31T11:00'),'monthly',1))).toBe('2026-02-28T11:00'));
  it('compte les jours calendaires suisses même quand les deux dates UTC sont identiques',()=>expect(eventCalendarDaySpan('2026-10-01T21:30:00Z','2026-10-01T22:30:00Z')).toBe(1));
  it('compte les jours calendaires à travers le changement d’heure',()=>expect(eventCalendarDaySpan('2026-10-24T22:00:00Z','2026-10-26T23:00:00Z')).toBe(2));
});
describe('Adresses web saisies naturellement',()=>{
  it.each(['monsite.ch','www.monsite.ch',' https://monsite.ch ','http://monsite.ch','//monsite.ch'])('accepte %s',value=>expect(webUrlSchema.safeParse(value).success).toBe(true));
  it.each(['javascript:alert(1)','data:text/html,hello','ftp://monsite.ch','https://user:pass@monsite.ch','not a url'])('refuse %s',value=>expect(webUrlSchema.safeParse(value).success).toBe(false));
  it('accepte un champ facultatif vide',()=>expect(webUrlSchema.parse('')).toBe(null));
});
describe('Validation des expériences',()=>{
  function form() { const fd=new FormData(); Object.entries({title:'Test',description:'Description de test suffisamment longue.',category_ids:'10000000-0000-4000-8000-000000000001',start_date:'2026-10-01T11:00',languages:'fr',duration_minutes:'1.5'}).forEach(([k,v])=>fd.set(k,v)); return fd; }
  it('convertit 1,5 heures en 90 minutes',()=>{const fd=form();fd.set('duration_minutes','1,5');const result=parseEventForm(fd);expect(result.success && result.data.duration_minutes).toBe(90);});
  it('ignore une ancienne durée horaire lorsqu’une date de fin est fournie',()=>{const fd=form();fd.set('end_date','2026-10-02T16:00');const result=parseEventForm(fd);expect(result.success && result.data.duration_minutes).toBe(null);});
  it('refuse la fin avant le début',()=>{const fd=form();fd.set('end_date','2026-09-01T11:00');expect(parseEventForm(fd).success).toBe(false);});
  it('accepte exactement le 9 et le 30 octobre comme dates supplémentaires',()=>{const fd=form();fd.set('recurrence','custom');fd.append('occurrence_dates','2026-10-09T11:00');fd.append('occurrence_dates','2026-10-30T11:00');const result=parseEventForm(fd);expect(result.success).toBe(true);if(result.success) expect(occurrenceSchedule(result.data).map(x=>toEventLocalInput(x.start_date))).toEqual(['2026-10-09T11:00','2026-10-30T11:00']);});
  it('refuse les doublons dans les dates libres',()=>{const fd=form();fd.set('recurrence','custom');fd.append('occurrence_dates','2026-10-09T11:00');fd.append('occurrence_dates','2026-10-09T11:00');expect(parseEventForm(fd).success).toBe(false);});
});
describe('Export agenda',()=>{
  it('respecte la durée enregistrée plutôt qu’une durée fixe de deux heures',()=>{
    expect(buildICS({uid:'test',title:'Yoga',start:'2026-10-01T09:00:00Z',durationMinutes:90})).toContain('DTEND:20261001T103000Z');
  });
});
