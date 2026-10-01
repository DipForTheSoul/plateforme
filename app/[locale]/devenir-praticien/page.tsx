import type {Metadata} from "next";
import Image from "next/image";
import {getTranslations,setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {createClient} from "@/lib/supabase/server";
import {CREDIT_PACKS,resolvePackPriceChf} from "@/lib/credits";
import {PackPrice} from "@/components/PackPrice";
import {ArrowRight,CalendarPlus,FilePlus2,Heart,Languages,MapPin,Megaphone,Plus,ShieldCheck,Sparkles,UserRound} from "lucide-react";

const SITE=process.env.NEXT_PUBLIC_SITE_URL??"https://forthesoul.ch";
const heroIcons=[Megaphone,Sparkles,Languages];
const stepIcons=[UserRound,ShieldCheck,CalendarPlus];
export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{const {locale}=await params;const t=await getTranslations({locale,namespace:"becomePractitioner"});const path="/devenir-praticien";return {title:t("metaTitle"),description:t("metaDescription"),alternates:{canonical:`${SITE}${locale==="fr"?"":`/${locale}`}${path}`,languages:{fr:`${SITE}${path}`,de:`${SITE}/de${path}`,en:`${SITE}/en${path}`}}};}

export default async function BecomePractitionerPage({params}:{params:Promise<{locale:string}>}){const {locale}=await params;setRequestLocale(locale);const t=await getTranslations("becomePractitioner");const db=await createClient();const {data}=await db.from("settings").select("key,value");const settings=Object.fromEntries((data??[]).map(r=>[r.key,r.value]));const heroBenefits=t.raw("heroBenefits") as string[];const benefits=t.raw("benefits") as {line1:string;line2:string}[];const steps=t.raw("steps") as {title:string;text:string}[];const faq=t.raw("faq") as {q:string;a:string}[];const validityDays=Math.max(1,Number(settings.pack_default_valid_days)||365);const validityMonths=Math.max(1,Math.round(validityDays/(365/12)));
return <main>
  <section className="relative overflow-hidden bg-gradient-to-br from-soul-sand/80 via-soul-cream to-white px-4 py-16 text-center sm:py-20">
    <div aria-hidden className="absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-soul-amber/10 blur-3xl" />
    <div className="relative mx-auto max-w-3xl">
      <h1 className="mx-auto max-w-3xl leading-[1.12] text-soul-brown">
        <span className="block text-[clamp(2rem,7vw,4.25rem)]">{t("titleLine1")}</span>
        <span className="mt-1 block whitespace-nowrap text-[clamp(2rem,7vw,4.25rem)]">{t("titleLine2")}</span>
      </h1>
      <p className="mx-auto mt-5 max-w-3xl text-[clamp(0.9rem,2.5vw,1.125rem)] font-normal leading-relaxed text-soul-bronze/90">{t("introMobile")}</p>
      <ul className="mx-auto mt-7 grid max-w-2xl grid-cols-3 gap-2 text-xs font-medium leading-tight text-soul-brown sm:gap-5 sm:text-sm">
        {heroBenefits.map((item,index)=>{const HeroIcon=heroIcons[index]??Sparkles;return <li className="flex min-w-0 flex-col items-center gap-2 text-center sm:flex-row sm:justify-center sm:text-left" key={item}><HeroIcon aria-hidden className="h-5 w-5 shrink-0 text-soul-violet"/><span>{item}</span></li>})}
      </ul>
      <div className="mx-auto mt-7 grid max-w-md grid-cols-[minmax(0,1.65fr)_minmax(0,0.85fr)] items-stretch justify-center gap-2.5 sm:flex sm:max-w-none sm:items-center sm:gap-3">
        <Link href="/inscription" className="btn-primary inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 whitespace-nowrap px-2 py-2 text-[clamp(0.65rem,2.8vw,0.875rem)] sm:px-6 sm:text-base">{t("cta")}<ArrowRight className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4"/></Link>
        <Link href="/connexion" className="inline-flex min-h-10 min-w-0 items-center justify-center rounded-full border border-soul-violet px-2 py-2 text-[clamp(0.7rem,3vw,0.875rem)] font-semibold text-soul-violet transition hover:bg-soul-violet/5 sm:px-6 sm:text-base">{t("loginCta")}</Link>
      </div>
    </div>
  </section>
  <section className="mx-auto max-w-6xl px-4 py-16">
    <h2 className="whitespace-nowrap text-[clamp(1.45rem,6vw,2.25rem)] leading-tight text-soul-brown">{t("benefitsTitle")}</h2>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {benefits.map((item,index)=>{const BenefitIcon=heroIcons[index]??Sparkles;return <article className="group relative overflow-hidden rounded-3xl border border-soul-violet/10 bg-gradient-to-br from-white via-white to-soul-violet/[0.06] p-5 shadow-[0_10px_30px_rgba(74,52,37,0.08)] transition duration-300 hover:-translate-y-1 hover:border-soul-violet/25 hover:shadow-[0_16px_38px_rgba(74,52,37,0.13)] sm:p-6" key={`${item.line1} ${item.line2}`}>
        <div aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-soul-violet/[0.07] transition-transform duration-300 group-hover:scale-125" />
        <div className="relative flex items-center gap-4 lg:block">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-soul-violet text-white shadow-sm lg:h-14 lg:w-14"><BenefitIcon aria-hidden className="h-6 w-6 lg:h-7 lg:w-7"/></span>
          <p className="whitespace-nowrap text-[clamp(0.72rem,3.5vw,1.125rem)] font-medium leading-relaxed text-soul-brown lg:mt-5"><span className="block">{item.line1}</span><span className="block">{item.line2}</span></p>
        </div>
      </article>})}
    </div>
  </section>
  <section className="relative overflow-hidden bg-white/65 py-16">
    <div className="relative mx-auto max-w-6xl px-4">
      <h2 className="text-center text-[clamp(1.45rem,6vw,2.25rem)] leading-tight text-soul-brown">{t("stepsTitle")}</h2>
      <div className="relative mt-10 grid gap-5 md:grid-cols-3">
        <div aria-hidden className="absolute left-1/2 top-0 hidden h-px w-[62%] -translate-x-1/2 bg-gradient-to-r from-transparent via-soul-violet/35 to-transparent md:block" />
        <div aria-hidden className="absolute bottom-8 left-7 top-8 w-px bg-soul-violet/20 md:hidden" />
        {steps.map((step,index)=>{const StepIcon=stepIcons[index]??Sparkles;return <article className="group relative ml-4 rounded-3xl border border-soul-violet/10 bg-gradient-to-br from-white to-soul-sand/35 p-6 pl-10 shadow-[0_10px_30px_rgba(74,52,37,0.07)] md:ml-0 md:p-7 md:pt-12" key={step.title}>
          <span className="absolute -left-4 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-soul-violet font-serif text-xl text-white shadow-md md:left-1/2 md:top-0 md:-translate-x-1/2 md:-translate-y-1/2">{index+1}</span>
          <StepIcon aria-hidden className="h-7 w-7 text-soul-violet transition-transform duration-300 group-hover:scale-110 md:mx-auto"/>
          <h3 className="mt-4 text-xl text-soul-brown md:text-center">{step.title.replace(/^\d+\.\s*/,"")}</h3>
          <p className="mt-3 leading-relaxed text-soul-ink/75 md:text-center">{step.text}</p>
        </article>})}
      </div>
    </div>
  </section>
  <section className="mx-auto max-w-6xl px-4 py-16">
    <div className="grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-soul-violet/10 px-3 py-1.5 text-sm font-semibold text-soul-violet"><FilePlus2 className="h-4 w-4"/>{t("publicationEyebrow")}</span>
        <h2 className="mt-4 text-[clamp(1.45rem,6vw,2.25rem)] leading-tight text-soul-brown">{t("packsTitle")}</h2>
        <p className="mt-3 max-w-xl text-[clamp(0.8rem,3.5vw,1.125rem)] leading-relaxed text-soul-bronze">{t("packsIntro")}</p>
      </div>
      <figure className="rounded-[2rem] bg-gradient-to-br from-soul-sand/55 to-white p-3 shadow-[0_18px_50px_rgba(74,52,37,0.12)] sm:p-5">
        <figcaption className="mb-3 flex items-center gap-2 text-sm font-semibold text-soul-violet"><Sparkles className="h-4 w-4"/>{t("publicationCaption")}</figcaption>
        <div className="grid items-center gap-3 sm:grid-cols-[0.8fr_auto_1.2fr]">
          <div>
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-soul-bronze">{t("publicationMock.homeLabel")}</p>
            <article className="overflow-hidden rounded-2xl border border-soul-bronze/10 bg-white shadow-lg">
              <div className="relative h-28 w-full overflow-hidden sm:h-36"><Image unoptimized src="/cat-meditation.jpg" alt={t("publicationImageAlt")} fill className="object-cover" sizes="220px"/><span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-soul-brown shadow"><Heart className="h-3.5 w-3.5"/></span></div>
              <div className="space-y-1.5 p-3 text-left"><p className="text-[11px] font-semibold text-soul-brown">{t("publicationMock.date")}</p><h3 className="font-serif text-base leading-tight text-soul-brown">{t("publicationMock.title")}</h3><p className="line-clamp-1 text-[10px] text-soul-bronze">{t("publicationMock.practitioner")} · {t("publicationMock.category")}</p><div className="flex items-center justify-between gap-2 pt-1 text-[10px]"><span className="flex min-w-0 items-center gap-1 text-soul-bronze"><MapPin className="h-3 w-3 shrink-0"/><span className="truncate">{t("publicationMock.location")}</span></span><span className="shrink-0 font-semibold text-soul-brown">{t("publicationMock.price")}</span></div></div>
            </article>
          </div>
          <ArrowRight aria-hidden className="mx-auto h-5 w-5 rotate-90 text-soul-violet sm:rotate-0"/>
          <div>
            <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.14em] text-soul-bronze">{t("publicationMock.detailLabel")}</p>
            <article className="overflow-hidden rounded-2xl border border-soul-bronze/10 bg-white shadow-lg">
              <div className="relative h-32 w-full overflow-hidden sm:h-40"><Image unoptimized src="/cat-meditation.jpg" alt={t("publicationImageAlt")} fill className="object-cover" sizes="320px"/></div>
              <div className="space-y-3 bg-soul-cream/65 p-4 text-left">
                <span className="inline-flex rounded-full bg-soul-amber/15 px-3 py-1 text-[10px] font-medium text-soul-brown">{t("publicationMock.category")}</span>
                <h3 className="font-serif text-xl leading-tight text-soul-brown">{t("publicationMock.title")}</h3>
                <p className="text-[11px] text-soul-bronze">{t("publicationMock.proposedBy")} <span className="font-semibold text-soul-brown underline">{t("publicationMock.practitioner")}</span> <span aria-hidden>· ✓</span> {t("publicationMock.validated")}</p>
                <p className="font-serif text-xl text-soul-brown">{t("publicationMock.price")}</p>
                <div className="grid grid-cols-[0.72fr_1.28fr] gap-2 pt-1">
                  <span className="flex min-h-9 items-center justify-center rounded-full bg-soul-violet px-3 text-[11px] font-semibold text-white">{t("publicationMock.reserve")}</span>
                  <span className="flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-soul-bronze/30 bg-white px-3 text-center text-[10px] font-semibold text-soul-brown"><CalendarPlus className="h-3.5 w-3.5 shrink-0"/>{t("publicationMock.calendar")}</span>
                </div>
                <div className="border-t border-soul-bronze/15 pt-3">
                  <h4 className="font-serif text-sm text-soul-brown">{t("publicationMock.aboutTitle")}</h4>
                  <p className="mt-1.5 line-clamp-3 text-[10px] leading-relaxed text-soul-ink/70">{t("publicationMock.description")}</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </figure>
    </div>
    <div className="mt-10 grid gap-5 sm:grid-cols-3">{CREDIT_PACKS.map((pack,index)=>{const price=resolvePackPriceChf(pack,settings);return <article className={`relative overflow-hidden rounded-3xl border bg-white p-6 shadow-[0_10px_30px_rgba(74,52,37,0.08)] ${index===1?"border-soul-violet/35 ring-2 ring-soul-violet/10":"border-soul-bronze/10"}`} key={pack.id}>
      {index===1&&<span className="absolute right-0 top-0 rounded-bl-2xl bg-soul-violet px-3 py-1.5 text-xs font-semibold text-white">{t("packFeatured")}</span>}
      <p className="text-sm font-semibold uppercase tracking-[0.14em] text-soul-bronze">{t("packLabel",{count:pack.credits})}</p>
      <p className="mt-4 font-serif text-4xl text-soul-brown"><PackPrice valueChf={price}/></p>
      <p className="mt-3 text-sm font-medium text-soul-ink/70"><PackPrice valueChf={price/pack.credits}/> {t("perPublication")}</p>
      <p className="mt-2 text-sm text-soul-bronze">{t("packValidityMonths",{count:validityMonths})}</p>
      <p className="mt-5 whitespace-nowrap border-t border-soul-bronze/10 pt-4 text-[clamp(0.65rem,3.2vw,0.875rem)] leading-relaxed text-soul-ink/70">{t(`packDescriptions.${index}`)}</p>
    </article>})}</div>
    <div className="mt-8 text-center">
      <Link href="/inscription" className="btn-primary inline-flex items-center justify-center gap-2 whitespace-nowrap">{t("cta")}<ArrowRight className="h-4 w-4"/></Link>
    </div>
  </section>
  <section className="mx-auto max-w-3xl px-4 py-16">
    <div className="mb-8 text-center">
      <h2 className="whitespace-nowrap font-serif text-[clamp(1.45rem,6vw,2.25rem)] leading-tight text-soul-brown">{t("faqTitle")}</h2>
      <p className="mt-3 whitespace-nowrap text-[clamp(0.8rem,3.5vw,1.125rem)] leading-relaxed text-soul-bronze">{t("faqSubtitle")}</p>
    </div>
    <div className="flex flex-col gap-3">{faq.map(item=><details className="group rounded-2xl border border-soul-bronze/15 bg-white px-5 transition open:shadow-sm" key={item.q}><summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-serif text-lg text-soul-brown marker:content-none [&::-webkit-details-marker]:hidden">{item.q}<Plus className="h-5 w-5 shrink-0 text-soul-bronze transition-transform duration-200 group-open:rotate-45"/></summary><p className="pb-5 leading-relaxed text-soul-ink/75">{item.a}</p></details>)}</div>
  </section>
</main>}
