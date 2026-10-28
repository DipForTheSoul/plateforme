import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {getLocale, getTranslations} from 'next-intl/server';
import {Link} from '@/i18n/navigation';
import {AdminAudienceFollowup} from '../admin/AudienceFollowup';
import {audiencePeriod} from '@/lib/audience-acquisition';
export const metadata:Metadata={title:'Proposition du tableau de bord',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
// Presentation only: never read the private administrative data.
export default async function AudiencePreview({searchParams}:{searchParams:Promise<{jours?:string;vue?:string}>}) {
 if(process.env.VERCEL_ENV!=='preview'&&process.env.QA_LOCAL!=='1')notFound();
 const [query,locale,t]=await Promise.all([searchParams,getLocale(),getTranslations('admin')]);
 const detailed=query.vue==='suivi'||(!query.vue&&!!query.jours);
 const copy=locale==='de'?{
   preview:'Vorschau',tracking:'Besucherübersicht',notice:'Beispieldaten zur Freigabe der Darstellung, keine echten Statistiken. Nur Übersicht und Besucherübersicht sind in dieser Vorschau aktiv.',
   examples:['Beispiel · Meditation am See','Beispiel · Bewegungsworkshop','Beispiel · Klangreise'],
   note:'Kumulierte Aufrufe der Detailseiten, getrennt von eindeutigen Besuchern.',
 }:locale==='en'?{
   preview:'Preview',tracking:'Visitor tracking',notice:'Sample data for reviewing the layout, not real statistics. Only the dashboard and visitor tracking are active in this preview.',
   examples:['Example · Lakeside meditation','Example · Movement workshop','Example · Sound journey'],
   note:'Cumulative detail-page views, separate from unique visitors.',
 }:{
   preview:'Aperçu',tracking:'Suivi',notice:'Données d’exemple pour valider la présentation, pas les statistiques réelles. Seuls le tableau de bord et le suivi sont consultables dans cet aperçu.',
   examples:['Exemple · Méditation au bord du lac','Exemple · Atelier de mouvement','Exemple · Voyage sonore'],
   note:'Vues cumulées des fiches, distinctes du nombre de visiteurs uniques.',
 };
 const cards=[['pendingSubmissions',2],['pendingPractitioners',1],['eventsOnline',24],['rejected',0],['activePractitioners',12],['creditsConsumed30d',8],['newsletterContacts',45]] as const;
 const passiveNav=['submissions','featured','practitioners','venues','credits','newsletter','forthesoulContact','practitionerContact','settings'];
 return <main className="mx-auto min-w-0 max-w-6xl px-4 py-8 [overflow-wrap:anywhere]">
   <h1 className="text-2xl text-soul-brown">{t('title')} · {copy.preview}</h1>
   <p className="my-5 rounded-xl border border-soul-violet/25 bg-white p-4 text-sm text-soul-violet">{copy.notice}</p>
   <nav aria-label={t('nav.menu')} className="mb-8 flex flex-wrap gap-2">
     {[{label:t('nav.dashboard'),href:'/apercu-suivi?vue=accueil',active:!detailed},{label:copy.tracking,href:'/apercu-suivi?vue=suivi',active:detailed}].map(item=>
       <Link key={item.href} href={item.href} aria-current={item.active?'page':undefined}
         className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium ${item.active?'border-soul-violet bg-soul-violet text-white':'border-soul-bronze/25 bg-white text-soul-brown'}`}>{item.label}</Link>)}
     {passiveNav.map(key=><span key={key} aria-disabled="true" className="hidden items-center rounded-full border border-soul-bronze/15 px-4 py-2 text-sm text-soul-bronze md:inline-flex">{t('nav.'+key)}</span>)}
   </nav>
   <div className="flex flex-col gap-8">
     {!detailed&&<>
       <h2 className="font-serif text-3xl text-soul-brown">{t('nav.dashboard')}</h2>
       <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
         {cards.map(([key,value])=><div key={key} className={`card p-6 ${key.startsWith('pending')?'ring-2 ring-soul-terracotta/50':''}`}>
           <p className="text-sm text-soul-bronze">{t('dashboard.'+key)}</p>
           <p className="mt-1 font-serif text-4xl text-soul-brown">{value}</p>
         </div>)}
       </div>
     </>}
     <AdminAudienceFollowup days={detailed?audiencePeriod(query.jours):30} compact={!detailed} preview/>
     {!detailed&&<section className="card min-w-0 p-6">
       <h2 className="font-serif text-lg text-soul-brown">{t('dashboard.topExperiences')}</h2>
       <ul className="mt-4 divide-y divide-soul-bronze/10">
         {copy.examples.map((title,index)=><li key={title} className="flex min-w-0 items-start gap-4 py-3 text-sm">
           <span className="w-10 shrink-0 text-right font-semibold tabular-nums">{[120,85,42][index]}</span>
           <div aria-hidden className="mt-1.5 h-2 shrink-0 rounded-full bg-soul-violet/70" style={{width:`${[30,21,10][index]}%`}}/>
           <span className="min-w-0 text-soul-bronze">{title}</span>
         </li>)}
       </ul>
       <p className="mt-4 text-xs leading-relaxed text-soul-bronze">{copy.note}</p>
     </section>}
   </div>
 </main>;
}
