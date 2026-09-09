import {getCurrentProfile} from '@/lib/auth';
import {isRateLimited} from '@/lib/rate-limit';
import {parseAddressResults} from '@/lib/address-search';

const reply = (body: unknown, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'private, no-store'}});

export async function GET(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return reply({error: 'unauthorized'}, 401);
    if (!['practitioner', 'admin'].includes(profile.role)) return reply({error: 'forbidden'}, 403);
    const params = new URL(request.url).searchParams;
    const query = (params.get('q') ?? '').trim().replace(/\s+/g, ' ');
    if (query.length < 4 || query.length > 160 || query.split(' ').length > 10) return reply({error: 'invalid_query'}, 400);
    if (await isRateLimited(`address-search:${profile.id}`, 30, 60)
      || await isRateLimited('address-search:global', 100, 60)) return reply({error: 'rate_limited'}, 429);
    const lang = ['fr', 'de', 'en'].includes(params.get('lang') ?? '') ? params.get('lang')! : 'fr';
    const upstream = new URL('https://api3.geo.admin.ch/rest/services/ech/SearchServer');
    upstream.search = new URLSearchParams({searchText: query, type: 'locations', origins: 'address', limit: '5', sr: '4326', lang}).toString();
    const response = await fetch(upstream, {signal: AbortSignal.timeout(5000), cache: 'no-store'});
    if (!response.ok) return reply({error: 'unavailable'}, 503);
    return reply({suggestions: parseAddressResults(await response.json())});
  } catch {
    // Do not log private search strings or upstream payloads.
    return reply({error: 'unavailable'}, 503);
  }
}
