import { z } from 'zod';
import { eventLocalToIso, shiftEventDate } from './event-time';
import { webUrlSchema } from './web-url';

const date = z.string().transform((value, ctx) => {
  try { return eventLocalToIso(value); }
  catch { ctx.addIssue({ code: 'custom', message: 'Date ou heure suisse invalide.' }); return z.NEVER; }
});
export const eventSchema = z.object({
  title: z.string().trim().min(3).max(140), description: z.string().trim().min(20).max(8000),
  category_ids: z.array(z.string().uuid()).min(1).max(6), venue_id: z.string().uuid().nullable(),
  start_date: date, end_date: date.nullable(),
  duration_minutes: z.number().int().min(1).max(525600).nullable(),
  price: z.coerce.number().min(0).max(99999999).nullable(),
  price_mode: z.enum(['fixed', 'free', 'flexible']),
  languages: z.array(z.enum(['fr', 'de', 'en', 'es', 'it'])).min(1).max(5),
  recurrence: z.enum(['weekly', 'biweekly', 'monthly', 'custom']).nullable(),
  recurrence_count: z.coerce.number().int().min(2).max(26).nullable(),
  occurrence_dates: z.array(date).max(25),
  included: z.string().max(2000).nullable(), to_bring: z.string().max(2000).nullable(),
  video_url: webUrlSchema, external_url: webUrlSchema.refine(v => !v || v.length <= 2048), images: z.array(z.string().url()).max(6),
}).superRefine((v, ctx) => {
  if (v.price_mode === 'fixed' && (v.price === null || v.price <= 0)) ctx.addIssue({ code: 'custom', path: ['price'], message: 'Indiquez un montant supérieur à zéro.' });
  if (v.end_date && v.end_date <= v.start_date) ctx.addIssue({ code: 'custom', path: ['end_date'], message: 'La fin doit suivre le début.' });
  if (v.recurrence === 'custom') {
    if (!v.occurrence_dates.length || new Set(v.occurrence_dates).size !== v.occurrence_dates.length || v.occurrence_dates.some(d => d <= v.start_date))
      ctx.addIssue({ code: 'custom', path: ['occurrence_dates'], message: 'Choisissez des dates différentes, après la première date.' });
  }
});

export function parseEventForm(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? '').trim();
  const endDate = text('end_date');
  const durationHours = text('duration_hours');
  const durationMinutePart = text('duration_minute_part');
  const legacyDurationHours = text('duration_minutes');
  let durationMinutes: number | null = null;
  if (!endDate) {
    if (durationHours || durationMinutePart) {
      const hours = durationHours ? Number(durationHours) : 0;
      const minutes = durationMinutePart ? Number(durationMinutePart) : 0;
      durationMinutes = Number.isInteger(hours) && hours >= 0 && hours <= 23
        && Number.isInteger(minutes) && minutes >= 0 && minutes <= 59
        ? hours * 60 + minutes
        : Number.NaN;
    } else if (legacyDurationHours) {
      // Compatibilité avec les formulaires et brouillons créés avant les deux sélecteurs.
      durationMinutes = Math.round(Number(legacyDurationHours.replace(',', '.')) * 60);
    }
  }
  return eventSchema.safeParse({
    title: text('title'), description: text('description'), category_ids: formData.getAll('category_ids'),
    venue_id: text('venue_id') || null, start_date: text('start_date'), end_date: endDate || null,
    duration_minutes: durationMinutes,
    price_mode: text('price_mode'),
    price: ['free', 'flexible'].includes(text('price_mode')) ? 0 : text('price') || null, languages: formData.getAll('languages'),
    recurrence: text('recurrence') || null,
    recurrence_count: text('recurrence') && text('recurrence') !== 'custom' ? text('recurrence_count') || 4 : null,
    occurrence_dates: formData.getAll('occurrence_dates').map(String).filter(Boolean),
    included: text('included') || null, to_bring: text('to_bring') || null,
    video_url: text('video_url'), external_url: text('external_url'), images: formData.getAll('images').map(String).filter(Boolean),
  });
}

export function occurrenceSchedule(input: z.infer<typeof eventSchema>) {
  if (!input.recurrence) return [];
  const dates = input.recurrence === 'custom' ? [...input.occurrence_dates].sort() :
    Array.from({ length: (input.recurrence_count ?? 4) - 1 }, (_, i) => shiftEventDate(input.start_date, input.recurrence as 'weekly' | 'biweekly' | 'monthly', i + 1));
  return dates.map((start_date, i) => ({ start_date, end_date: !input.end_date ? null : input.recurrence === 'custom'
    ? new Date(Date.parse(start_date) + Date.parse(input.end_date) - Date.parse(input.start_date)).toISOString()
    : shiftEventDate(input.end_date, input.recurrence as 'weekly' | 'biweekly' | 'monthly', i + 1) }));
}
