import {z} from 'zod';

export const pointSchema = z.object({lat: z.number().finite().min(-90).max(90), lng: z.number().finite().min(-180).max(180)});
export type AddressPoint = z.infer<typeof pointSchema>;
export const addressSuggestionSchema = pointSchema.extend({
  address: z.string().min(5).max(300), city: z.string().max(120), canton: z.string().max(2), country: z.literal('CH'),
});
export type AddressSuggestion = z.infer<typeof addressSuggestionSchema>;
const responseSchema = z.object({results: z.array(z.object({attrs: z.object({
  origin: z.string(), label: z.string().max(1000), detail: z.string().max(1000), lat: z.number(), lon: z.number(),
})}))});

// Provider labels contain markup. Never render it as HTML.
function plainLabel(label: string) {
  return label.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function parseAddressResults(data: unknown): AddressSuggestion[] {
  const response = responseSchema.parse(data);
  return response.results.flatMap(({attrs}) => {
    if (attrs.origin !== 'address') return [];
    const address = plainLabel(attrs.label);
    const city = address.match(/\b\d{4}\s+(.+)$/)?.[1] ?? '';
    const canton = attrs.detail.match(/\bch\s+([a-z]{2})$/i)?.[1]?.toUpperCase() ?? '';
    const parsed = addressSuggestionSchema.safeParse({address, city, canton, country: 'CH', lat: attrs.lat, lng: attrs.lon});
    return parsed.success ? [parsed.data] : [];
  }).slice(0, 5);
}

/** Parse an explicitly chosen point; blank fields must never become zero. */
export function readVenuePoint(form: FormData): AddressPoint | null {
  const lat = String(form.get('lat') ?? '').trim();
  const lng = String(form.get('lng') ?? '').trim();
  if (!lat && !lng) return null;
  if (!lat || !lng) throw new Error('Invalid point');
  return pointSchema.parse({lat: Number(lat), lng: Number(lng)});
}
