import {getTranslations} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';

export async function AdminPageViews() {
  const t=await getTranslations('admin');
  let pages:{path:string;views:number}[]|undefined;
  try {
    const db=await createClient();
    const {data,error}=await db.rpc('get_admin_page_view_summary').abortSignal(AbortSignal.timeout(4000));
    if(!error) pages=data?.[0]?.pages;
  } catch { /* An unavailable statistic must not prevent navigation. */ }
  return <section className="card min-w-0 p-6" aria-labelledby="page-views-title">
    <h2 id="page-views-title" className="mb-4 font-serif text-lg text-soul-brown">{t('dashboard.audience30d')}</h2>
    {!pages?<p role="status" className="text-sm text-soul-bronze">{t('dashboard.unavailable')}</p>:pages.length===0?<p className="text-sm text-soul-bronze">{t('dashboard.noData')}</p>:
      <ul className="flex flex-col gap-3">{pages.map(row=><li key={row.path} className="flex min-w-0 items-center gap-3 text-sm">
        <span className="w-20 shrink-0 text-right font-medium text-soul-brown">{row.views}</span>
        <div aria-hidden className="h-2 shrink-0 rounded-full bg-soul-terracotta/70" style={{width:`${Math.max(1,(row.views/Math.max(1,pages![0].views))*30)}%`}} />
        <span className="min-w-0 break-all text-soul-bronze">{row.path}</span>
      </li>)}</ul>}
    <p className="mt-4 text-xs text-soul-bronze">{t('dashboard.analyticsNote')}</p>
  </section>;
}
