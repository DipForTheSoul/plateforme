import {getLocale, getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {createClient} from '@/lib/supabase/server';

const notes = {
  fr: 'Vues cumulées des fiches, distinctes du nombre de visiteurs uniques.',
  en: 'Cumulative detail-page views, separate from unique visitors.',
  de: 'Kumulierte Aufrufe der Detailseiten, getrennt von eindeutigen Besuchern.',
};

/** Read only eight counters; never reload the historical page_views table. */
export async function AdminExperienceViews() {
  const t = await getTranslations('admin');
  const locale = await getLocale();
  let rows: {id: string; title: string; slug: string; view_count: number}[] = [];
  let unavailable = false;
  try {
    const db = await createClient();
    const {data, error} = await db.from('events')
      .select('id,title,slug,view_count').eq('status', 'approved')
      .order('view_count', {ascending: false}).order('id')
      .limit(8).abortSignal(AbortSignal.timeout(4000));
    if (error) unavailable = true;
    else rows = data ?? [];
  } catch {
    unavailable = true;
  }
  return <section className="card min-w-0 p-6" aria-labelledby="experience-views-title">
    <h2 id="experience-views-title" className="font-serif text-lg text-soul-brown">{t('dashboard.topExperiences')}</h2>
    {unavailable ? <p role="status" className="mt-4 text-sm text-soul-bronze">{t('dashboard.unavailable')}</p> : rows.length === 0 ?
      <p className="mt-4 text-sm text-soul-bronze">{t('dashboard.noData')}</p> :
      <ul className="mt-4 flex flex-col divide-y divide-soul-bronze/10">
        {rows.map(row => <li key={row.id} className="flex min-w-0 items-start gap-4 py-3 text-sm">
          <span className="w-16 shrink-0 text-right font-semibold tabular-nums text-soul-brown">{row.view_count.toLocaleString(locale)}</span>
          <div aria-hidden className="mt-1.5 h-2 shrink-0 rounded-full bg-soul-violet/70" style={{width:`${row.view_count>0?Math.max(1,row.view_count/Math.max(1,rows[0].view_count)*30):0}%`}} />
          <Link href={`/experiences/${row.slug}`} className="min-w-0 break-words text-soul-bronze underline-offset-4 hover:text-soul-violet hover:underline">{row.title}</Link>
        </li>)}
      </ul>}
    <p className="mt-4 text-xs leading-relaxed text-soul-bronze">{notes[locale as keyof typeof notes] ?? notes.fr}</p>
  </section>;
}
