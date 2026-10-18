import {getLocale,getTranslations} from 'next-intl/server';
import {createClient} from '@/lib/supabase/server';

export async function AdminPageViews() {
  const t=await getTranslations('admin');
  const locale=await getLocale();
  const copy=locale==='de'?{empty:'Die neue Messung beginnt bei null.',note:'Gemessene Browser je Seite, einmal täglich gezählt.'}:locale==='en'?{empty:'The new measurement starts at zero.',note:'Measured browsers per page, counted once a day.'}:{empty:'La nouvelle mesure démarre à zéro.',note:'Navigateurs mesurés par page, comptabilisés une fois par jour.'};
  let pages:{path:string;views:number}[]|undefined;
  try {
    const db=await createClient();
    const {data,error}=await db.rpc('get_admin_page_view_summary').abortSignal(AbortSignal.timeout(4000));
    if(!error) pages=data?.[0]?.pages;
  } catch { /* An unavailable statistic must not prevent navigation. */ }
  return <section className="card min-w-0 p-6" aria-labelledby="page-views-title">
    <h2 id="page-views-title" className="mb-4 font-serif text-lg text-soul-brown">{t('dashboard.audience30d')}</h2>
    {!pages?<p role="status" className="text-sm text-soul-bronze">{t('dashboard.unavailable')}</p>:pages.length===0?<><p className="font-serif text-4xl text-soul-brown">0</p><p className="mt-3 text-sm text-soul-bronze">{copy.empty}</p></>:
      <ul className="flex flex-col gap-3">{pages.map(row=><li key={row.path} className="flex min-w-0 items-center gap-3 text-sm">
        <span className="w-20 shrink-0 text-right font-medium text-soul-brown">{row.views}</span>
        <div aria-hidden className="h-2 shrink-0 rounded-full bg-soul-terracotta/70" style={{width:`${Math.max(1,(row.views/Math.max(1,pages![0].views))*30)}%`}} />
        <span className="min-w-0 break-all text-soul-bronze">{row.path}</span>
      </li>)}</ul>}
    <p className="mt-4 text-xs text-soul-bronze">{copy.note}</p>
  </section>;
}
