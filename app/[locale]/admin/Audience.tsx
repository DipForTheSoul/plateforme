import { createClient } from '@/lib/supabase/server';
import { getLocale } from 'next-intl/server';

const copy = {
 fr: {title:'Visiteurs mesurés — 30 jours', empty:'Mesure démarrée : aucun navigateur comptabilisé pour le moment.', note:'Navigateurs uniques estimés ayant accepté la mesure. Robots identifiés, comptes connectés et prévisualisations exclus. Un appareil différent ou un stockage effacé peut compter à nouveau. Ce chiffre ne couvre pas tous les visiteurs.', history:'L’ancien historique est conservé, mais exclu de cette mesure car il contient du trafic automatisé.', since:'Mesure disponible depuis le', error:'La mesure d’audience est momentanément indisponible. Les autres fonctions restent accessibles.', reload:'Recharger'},
 en: {title:'Measured visitors — 30 days', empty:'Measurement started: no browsers recorded yet.', note:'Estimated unique browsers that consented to measurement. Identified bots, signed-in accounts and previews excluded. Another device or cleared storage may count again. This does not cover all visitors.', history:'Previous history is preserved but excluded because it includes automated traffic.', since:'Measurement available since', error:'Audience measurement is temporarily unavailable. Other functions remain accessible.', reload:'Reload'},
 de: {title:'Gemessene Besucher — 30 Tage', empty:'Messung gestartet: noch keine Browser erfasst.', note:'Geschätzte eindeutige Browser mit Einwilligung. Erkannte Bots, angemeldete Konten und Vorschauen ausgeschlossen. Andere Geräte oder gelöschter Speicher können erneut zählen. Nicht alle Besucher werden erfasst.', history:'Der bisherige Verlauf bleibt erhalten, wird aber wegen automatisierten Datenverkehrs nicht einbezogen.', since:'Messung verfügbar seit', error:'Die Besuchermessung ist vorübergehend nicht verfügbar. Andere Funktionen bleiben zugänglich.', reload:'Neu laden'},
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
  {Number(row!.visitors)>0?<p className="my-3 text-4xl">{Number(row!.visitors).toLocaleString(locale)}</p>:<p className="my-3">{t.empty}</p>}
  <p className="text-sm">{t.since} {new Date(row!.started_at).toLocaleDateString(locale,{timeZone:'Europe/Zurich'})}.</p>
  <p className="mt-3 text-sm">{locale==='de'?'Geschätzte Besucher mit Einwilligung zur Reichweitenmessung.':locale==='en'?'Estimated visitors who accepted audience measurement.':'Estimation des visiteurs ayant accepté la mesure d’audience.'}</p>
 </section>;
}
