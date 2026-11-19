import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';
import {audienceMonth, audienceMonths} from '@/lib/audience-period';

const copy = {
 fr: {title:'Visiteurs mesurés — 30 jours', empty:'Mesure démarrée : aucun navigateur comptabilisé pour le moment.', note:'Navigateurs uniques estimés ayant accepté la mesure. Robots identifiés, comptes connectés et prévisualisations exclus. Un appareil différent ou un stockage effacé peut compter à nouveau. Ce chiffre ne couvre pas tous les visiteurs.', history:'L’ancien historique est conservé, mais exclu de cette mesure car il contient du trafic automatisé.', since:'Mesure disponible depuis le', error:'La mesure d’audience est momentanément indisponible. Les autres fonctions restent accessibles.', reload:'Recharger'},
 en: {title:'Measured visitors — 30 days', empty:'Measurement started: no browsers recorded yet.', note:'Estimated unique browsers that consented to measurement. Identified bots, signed-in accounts and previews excluded. Another device or cleared storage may count again. This does not cover all visitors.', history:'Previous history is preserved but excluded because it includes automated traffic.', since:'Measurement available since', error:'Audience measurement is temporarily unavailable. Other functions remain accessible.', reload:'Reload'},
 de: {title:'Gemessene Besucher — 30 Tage', empty:'Messung gestartet: noch keine Browser erfasst.', note:'Geschätzte eindeutige Browser mit Einwilligung. Erkannte Bots, angemeldete Konten und Vorschauen ausgeschlossen. Andere Geräte oder gelöschter Speicher können erneut zählen. Nicht alle Besucher werden erfasst.', history:'Der bisherige Verlauf bleibt erhalten, wird aber wegen automatisierten Datenverkehrs nicht einbezogen.', since:'Messung verfügbar seit', error:'Die Besuchermessung ist vorübergehend nicht verfügbar. Andere Funktionen bleiben zugänglich.', reload:'Neu laden'},
};
const labels = {
 fr: {title:'Visiteurs mesurés', period:'Période', rolling:'30 derniers jours', show:'Afficher', from:'Du', to:'au', explanation:'Comprendre ce chiffre', rollingNote:'La période avance chaque jour. Le total peut diminuer lorsque des visiteurs sortent des 30 derniers jours. L’historique reste conservé.', monthNote:'Le total correspond au mois choisi. Pour le mois en cours, seules les journées déjà écoulées et aujourd’hui sont comptées.', zero:'Aucun navigateur mesuré sur cette période.', partial:'Cette période commence avant le début de la mesure : seules les données disponibles sont comptées.'},
 en: {title:'Measured visitors', period:'Period', rolling:'Last 30 days', show:'Show', from:'From', to:'to', explanation:'About this number', rollingNote:'The period moves forward each day. The total can decrease when visitors fall outside the last 30 days. History is preserved.', monthNote:'The total covers the selected month. The current month includes only elapsed days and today.', zero:'No browsers measured during this period.', partial:'This period starts before measurement began: only available data is counted.'},
 de: {title:'Gemessene Besucher', period:'Zeitraum', rolling:'Letzte 30 Tage', show:'Anzeigen', from:'Vom', to:'bis', explanation:'Was diese Zahl bedeutet', rollingNote:'Der Zeitraum verschiebt sich täglich. Die Zahl kann sinken, wenn Besuche länger als 30 Tage zurückliegen. Der Verlauf bleibt erhalten.', monthNote:'Die Zahl bezieht sich auf den gewählten Monat. Im laufenden Monat werden nur vergangene Tage und der heutige Tag berücksichtigt.', zero:'In diesem Zeitraum wurden keine Browser erfasst.', partial:'Dieser Zeitraum beginnt vor dem Messbeginn: Es werden nur verfügbare Daten gezählt.'},
};
export async function AdminAudience({month}: {month?: string | string[]} = {}) {
 const locale=await getLocale(); const t=copy[locale as keyof typeof copy]??copy.fr;
 const l=labels[locale as keyof typeof labels]??labels.fr;
 const selected=audienceMonth(month);
 let row: {visitors:number;started_at:string;period_start:string;period_end:string}|undefined;
 try {
  const db=await createClient();
  const {data,error}=await db.rpc('get_admin_audience_period', {p_month: selected ?? null}).abortSignal(AbortSignal.timeout(4000));
  if(error||!data?.[0])throw new Error('Audience unavailable');
  row=data[0];
 } catch {
  return <section className="card p-6" role="status"><h2>{t.title}</h2><p>{t.error}</p><a href="?audienceMonth=#audience-visitors" className="inline-flex min-h-11 items-center underline">{t.reload}</a></section>;
 }
 const formatDate=(date:string)=>new Date(date+'T12:00:00Z').toLocaleDateString(locale,{timeZone:'Europe/Zurich'});
 const months=audienceMonths(row!.started_at, new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Zurich'}));
 const measurementDay=new Date(row!.started_at).toLocaleDateString('en-CA',{timeZone:'Europe/Zurich'});
 return <section id="audience-visitors" className="card min-w-0 scroll-mt-24 p-6" aria-labelledby="audience-title">
  <h2 id="audience-title" className="font-serif text-lg">{l.title}</h2>
  <form method="get" action="#audience-visitors" className="mt-4 flex flex-wrap items-end gap-3">
   <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm text-soul-brown" htmlFor="audience-period">
    {l.period}
    <select id="audience-period" name="audienceMonth" defaultValue={selected ?? 'rolling'} className="min-h-11 w-full rounded-xl border border-soul-bronze/30 bg-white px-3 py-2 text-soul-ink">
     <option value="rolling">{l.rolling}</option>
     {months.map(value=><option key={value} value={value}>{new Date(value+'-01T12:00:00Z').toLocaleDateString(locale,{month:'long',year:'numeric',timeZone:'Europe/Zurich'})}</option>)}
    </select>
   </label>
   <button type="submit" className="btn-primary min-h-11">{l.show}</button>
  </form>
  {Number(row!.visitors)>0?<p className="my-3 font-serif text-4xl text-soul-brown">{Number(row!.visitors).toLocaleString(locale)}</p>:<p className="my-3">{l.zero}</p>}
  <p className="text-sm font-medium text-soul-brown">{l.from} {formatDate(row!.period_start)} {l.to} {formatDate(row!.period_end)}</p>
  <p className="mt-2 text-xs text-soul-bronze">{t.since} {new Date(row!.started_at).toLocaleDateString(locale,{timeZone:'Europe/Zurich'})}.</p>
  {row!.period_start<measurementDay&&<p className="mt-2 text-xs text-soul-bronze">{l.partial}</p>}
  <details className="mt-4 text-sm text-soul-brown/80">
   <summary className="min-h-11 cursor-pointer py-2 text-soul-violet">{l.explanation}</summary>
   <p className="mt-2">{selected?l.monthNote:l.rollingNote}</p>
   <p className="mt-3">{t.note}</p>
  </details>
 </section>;
}
