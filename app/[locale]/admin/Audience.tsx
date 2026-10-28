import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';

const copy = {
 fr: {title:'Visiteurs estimés — 30 jours', empty:'Aucun navigateur comptabilisé pour le moment.', note:'Un même navigateur compte une fois sur les 30 derniers jours, même s’il consulte plusieurs pages ou revient. Un autre appareil ou un stockage effacé peut compter à nouveau. Robots identifiés, comptes connectés, prévisualisations et oppositions exclus. Ce compteur est indépendant de Google Analytics. L’historique conservé avant la séparation ne couvre que les navigateurs consentants.', since:'Mesure disponible depuis le', error:'La mesure d’audience est momentanément indisponible. Les autres fonctions restent accessibles.', reload:'Recharger'},
 en: {title:'Estimated visitors — 30 days', empty:'No browsers recorded yet.', note:'The same browser counts once over the last 30 days, even across several pages or return visits. Another device or cleared storage can count again. Identified bots, signed-in accounts, previews and opt-outs excluded. This counter is independent of Google Analytics. The preserved history before separation only covers consenting browsers.', since:'Measurement available since', error:'Audience measurement is temporarily unavailable. Other functions remain accessible.', reload:'Reload'},
 de: {title:'Geschätzte Besucher — 30 Tage', empty:'Noch keine Browser erfasst.', note:'Derselbe Browser zählt in den letzten 30 Tagen einmal, auch bei mehreren Seiten oder erneuten Besuchen. Ein anderes Gerät oder gelöschter Speicher kann erneut zählen. Erkannte Bots, angemeldete Konten, Vorschauen und Widersprüche sind ausgeschlossen. Der Zähler ist unabhängig von Google Analytics. Der erhaltene Verlauf vor der Trennung umfasst nur Browser mit Einwilligung.', since:'Messung verfügbar seit', error:'Die Besuchermessung ist vorübergehend nicht verfügbar. Andere Funktionen bleiben zugänglich.', reload:'Neu laden'},
};
export async function AdminAudience() {
 const locale=await getLocale(); const t=copy[locale as keyof typeof copy]??copy.fr;
 let row: {visitors:number;started_at:string}|undefined;
 try {
  const db=await createClient();
  const {data,error}=await db.rpc('get_admin_visitors').abortSignal(AbortSignal.timeout(4000));
  if(error||!data?.[0])throw new Error('Audience unavailable');
  row=data[0];
 } catch {
  return <section className="card p-6" role="status"><h2>{t.title}</h2><p>{t.error}</p><a href="" className="inline-flex min-h-11 items-center underline">{t.reload}</a></section>;
 }
 return <section className="card p-6"><h2 className="font-serif text-lg">{t.title}</h2>
  {Number(row!.visitors)>0?<p className="my-3 font-serif text-4xl text-soul-brown">{Number(row!.visitors).toLocaleString(locale)}</p>:<p className="my-3">{t.empty}</p>}
  <p className="text-sm">{t.since} {new Date(row!.started_at).toLocaleDateString(locale,{timeZone:'Europe/Zurich'})}.</p>
  <p className="mt-3 text-sm">{t.note}</p>
 </section>;
}
