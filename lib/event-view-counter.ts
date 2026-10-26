import 'server-only';
import {headers} from 'next/headers';
import {createAdminClient} from '@/lib/supabase/admin';
import {isAutomatedAgent} from '@/lib/traffic-policy';

/** Cumulative consultations, not unique visitors. Public reads retain their RLS. */
export async function recordEventView(eventId: string): Promise<void> {
  try {
    const h = await headers();
    if ((process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') ||
        isAutomatedAgent(h.get('user-agent')) ||
        h.get('next-router-prefetch') === '1' ||
        h.get('purpose') === 'prefetch' ||
        h.get('sec-purpose')?.includes('prefetch')) return;
    // Only this internal write uses the privileged client. SQL checks approved status.
    const {error} = await createAdminClient().rpc('increment_event_view', {
      p_event_id: eventId,
    }).abortSignal(AbortSignal.timeout(1500));
    if (error) console.warn('Event view counter unavailable');
  } catch {
    // Secondary measurement must not make a public offer unavailable.
    console.warn('Event view counter unavailable');
  }
}
