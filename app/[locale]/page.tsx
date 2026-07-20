import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EventCard } from "@/components/EventCard";
import { JsonLd } from "@/components/JsonLd";
import { categoryVisual } from "@/lib/gradients";
import { getApprovedEvents, getCategories, getTopEvents } from "@/lib/queries";
import { organizationJsonLd } from "@/lib/seo";
import { ArrowRight, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");

  const [topEvents, upcoming, categories] = await Promise.all([
    getTopEvents(3),
    getApprovedEvents(),
    getCategories(),
  ]);
  const upcomingNonTop = upcoming.filter((e) => !e.is_top).slice(0, 6);

  const badges = [
    { icon: ShieldCheck, label: t("heroBadge1") },
    { icon: MapPin, label: t("heroBadge2") },
    { icon: Sparkles, label: t("heroBadge3") },
  ];

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />

      {/* ------------------------------------------------------------------ */}
      {/* Hero */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-soul-sand/70 via-soul-cream to-soul-cream">
        {/* halos décoratifs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-soul-amber/20 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-soul-terracotta/10 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-soul-bronze/25 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-soul-bronze backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              {t("didierEyebrow")}
            </p>

            <h1 className="font-serif text-4xl leading-[1.1] text-soul-brown sm:text-5xl lg:text-6xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-soul-ink/70">
              {t("heroSubtitle")}
            </p>

            <form action="/experiences" className="mt-8 max-w-lg">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-soul-bronze" />
                <input
                  type="search"
                  name="q"
                  placeholder={t("searchPlaceholder")}
                  aria-label={t("searchPlaceholder")}
                  className="w-full rounded-full border border-soul-bronze/20 bg-white py-4 pl-13 pr-32 text-sm text-soul-ink shadow-lg shadow-soul-bronze/10 outline-none transition placeholder:text-soul-bronze/50 focus:border-soul-bronze focus:ring-2 focus:ring-soul-bronze/20"
                />
                <button
                  type="submit"
                  className="btn-accent absolute right-1.5 top-1/2 -translate-y-1/2 !px-5 !py-2.5"
                >
                  {t("heroCta")}
                </button>
              </div>
            </form>

            <div className="mt-6">
              <Link
                href="/praticiens"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-soul-brown underline-offset-4 hover:text-soul-terracotta hover:underline"
              >
                {t("heroSecondary")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Badges de confiance */}
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
              {badges.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-sm font-medium text-soul-brown/80"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-soul-sand text-soul-bronze">
                    <Icon className="h-4 w-4" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Photo de Didier — présente mais juste (méditation, regard baissé). */}
          <div className="relative mx-auto hidden w-full max-w-sm md:block">
            <div className="absolute -inset-3 rounded-[2rem] bg-white/40 blur-xl" aria-hidden />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-2xl shadow-soul-brown/20 ring-1 ring-white/40">
              <Image
                src="/didier-yoga.jpg"
                alt="Didier Picamoles en méditation"
                fill
                priority
                sizes="(max-width: 768px) 0px, 400px"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-soul-ink/70 to-transparent p-5">
                <p className="font-serif text-lg text-soul-cream">Didier Picamoles</p>
                <p className="text-xs text-soul-sand/80">{tCommon("footer.curated")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Catégories */}
      {/* ------------------------------------------------------------------ */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex flex-col gap-1">
          <h2 className="font-serif text-3xl text-soul-brown">{t("categoriesTitle")}</h2>
          <p className="text-soul-bronze">{t("categoriesSubtitle")}</p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            const visual = categoryVisual(category.slug);
            return (
              <Link
                key={category.id}
                href={`/experiences?categorie=${category.slug}`}
                className="group relative flex h-44 items-end overflow-hidden rounded-2xl shadow-sm transition hover:shadow-lg"
                style={{ background: visual.gradient }}
              >
                <span
                  aria-hidden
                  className="absolute right-3 top-3 text-4xl opacity-90 transition group-hover:scale-110"
                >
                  {visual.emoji}
                </span>
                <div className="relative w-full bg-gradient-to-t from-black/45 to-transparent p-4">
                  <span className="font-serif text-lg font-medium leading-tight text-white drop-shadow">
                    {category.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Sélection du moment (top listings) */}
      {/* ------------------------------------------------------------------ */}
      {topEvents.length > 0 && (
        <section className="bg-white/60 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <div className="mb-8 flex flex-col gap-1">
              <h2 className="font-serif text-3xl text-soul-brown">{t("topTitle")}</h2>
              <p className="text-soul-bronze">{t("topSubtitle")}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Prochaines expériences */}
      {/* ------------------------------------------------------------------ */}
      {upcomingNonTop.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-16">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-3xl text-soul-brown">{t("upcomingTitle")}</h2>
              <p className="text-soul-bronze">{t("upcomingSubtitle")}</p>
            </div>
            <Link
              href="/experiences"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-soul-terracotta hover:underline"
            >
              {t("upcomingCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingNonTop.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* La curation de Didier — bandeau incarné */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-soul-brown text-soul-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1fr_1.1fr] md:py-20">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[1.75rem] shadow-2xl ring-1 ring-soul-cream/15">
              <Image
                src="/didier.jpg"
                alt="Didier Picamoles, fondateur de ForTheSoul"
                fill
                sizes="(max-width: 768px) 100vw, 400px"
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <p className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-soul-amber">
              <Sparkles className="h-3.5 w-3.5" />
              {t("didierEyebrow")}
            </p>
            <h2 className="font-serif text-3xl leading-tight text-soul-cream sm:text-4xl">
              {t("didierTitle")}
            </h2>
            <blockquote className="mt-6 border-l-2 border-soul-amber/60 pl-5 font-serif text-xl italic leading-relaxed text-soul-sand">
              « {t("didierQuote")} »
            </blockquote>
            <p className="mt-3 text-sm text-soul-bronze">{t("didierSignature")}</p>
            <p className="mt-6 max-w-xl text-soul-sand/80">{t("didierText")}</p>
            <Link
              href="/a-propos"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-soul-cream px-6 py-3 text-sm font-semibold text-soul-brown transition hover:bg-soul-amber"
            >
              {t("didierCta")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
