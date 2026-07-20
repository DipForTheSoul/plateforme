import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EventCard } from "@/components/EventCard";
import { JsonLd } from "@/components/JsonLd";
import { categoryVisual } from "@/lib/gradients";
import { getApprovedEvents, getCategories, getTopEvents } from "@/lib/queries";
import { organizationJsonLd } from "@/lib/seo";
import { Search } from "lucide-react";

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

  return (
    <div>
      <JsonLd data={organizationJsonLd()} />

      {/* Hero */}
      <section className="bg-gradient-to-b from-soul-sand/60 to-soul-cream">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <h1 className="text-4xl leading-tight text-soul-brown sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-soul-ink/70">{t("heroSubtitle")}</p>

            <form action="/experiences" className="mt-8 max-w-md">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soul-bronze" />
                <input
                  type="search"
                  name="q"
                  placeholder={t("searchPlaceholder")}
                  className="field !rounded-full !py-3.5 !pl-12 shadow-md"
                />
              </div>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/experiences" className="btn-accent">{t("heroCta")}</Link>
              <Link href="/praticiens" className="btn-secondary">{t("heroSecondary")}</Link>
            </div>
          </div>

          {/* PLACEHOLDER — à remplacer par une vraie photo de Didier (portrait
              chaleureux). Emplacement prêt : public/didier.jpg, puis remplacer
              ce bloc par <Image src="/didier.jpg" …/>. */}
          <div className="relative mx-auto hidden aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl md:block"
            style={{ background: "linear-gradient(160deg, #443420 0%, #9e7c52 60%, #fdead2 100%)" }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8 text-center text-soul-cream">
              <span className="text-6xl">🌿</span>
              <p className="font-serif text-xl">Didier Picamoles</p>
              <p className="text-sm text-soul-sand/80">
                Fondateur — chaque expérience est validée avec cœur
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-6 text-2xl text-soul-brown">{t("categoriesTitle")}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => {
            const visual = categoryVisual(category.slug);
            return (
              <Link key={category.id}
                href={`/experiences?categorie=${category.slug}`}
                className="group relative h-32 overflow-hidden rounded-2xl"
                style={{ background: visual.gradient }}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-3 text-center transition group-hover:scale-105">
                  <span className="text-3xl">{visual.emoji}</span>
                  <span className="text-sm font-semibold text-white drop-shadow">
                    {category.name}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Top listings */}
      {topEvents.length > 0 && (
        <section className="bg-white/60 py-14">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-2xl text-soul-brown">{t("topTitle")}</h2>
            <p className="mt-1 text-soul-bronze">{t("topSubtitle")}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Touche Didier */}
      <section className="mx-auto max-w-4xl px-4 py-14 text-center">
        <h2 className="text-2xl text-soul-brown">{t("didierTitle")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-soul-ink/70">{t("didierText")}</p>
        <Link href="/a-propos" className="btn-secondary mt-6">{t("didierCta")}</Link>
      </section>

      {/* Prochaines expériences */}
      {upcomingNonTop.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-2xl text-soul-brown">{t("upcomingTitle")}</h2>
            <Link href="/experiences" className="text-sm text-soul-terracotta underline">
              {tCommon("nav.experiences")} →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingNonTop.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
