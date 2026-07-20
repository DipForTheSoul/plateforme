import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { FavoriteButton } from "@/components/FavoriteButton";
import { getApprovedPractitioners } from "@/lib/queries";
import { LANGUAGE_LABELS } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "practitioners" });
  return { title: t("title"), description: t("subtitle") };
}

/** Annuaire public des praticien·nes (Phase 4) avec recherche côté serveur. */
export default async function PractitionersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { q } = await searchParams;
  const t = await getTranslations("practitioners");

  let practitioners = await getApprovedPractitioners();
  if (q) {
    const needle = q.toLowerCase();
    practitioners = practitioners.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.specialties.some((s) => s.toLowerCase().includes(needle))
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl text-soul-brown">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-soul-bronze">{t("subtitle")}</p>

      <form className="mt-6 max-w-md">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={t("searchPlaceholder")}
          className="field !rounded-full"
        />
      </form>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {practitioners.map((p) => (
          <article key={p.id} className="card group relative">
            <Link href={`/praticiens/${p.slug}`} className="absolute inset-0 z-10">
              <span className="sr-only">{p.name}</span>
            </Link>
            <div className="relative h-52 w-full overflow-hidden">
              {p.photos[0] ? (
                <Image src={p.photos[0]} alt={p.name} fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-soul-brown to-soul-bronze text-5xl text-soul-cream"
                  aria-hidden="true">
                  {/* PLACEHOLDER — photo du praticien à ajouter via sa fiche */}
                  <span className="font-serif">{p.name.charAt(0)}</span>
                </div>
              )}
              <div className="absolute right-3 top-3 z-20">
                <FavoriteButton kind="practitioner" id={p.id} />
              </div>
            </div>
            <div className="p-5">
              <h2 className="font-serif text-xl text-soul-brown">{p.name}</h2>
              <p className="mt-1 text-sm text-soul-bronze">
                {p.specialties.slice(0, 3).join(" · ")}
              </p>
              <p className="mt-2 text-xs text-soul-bronze/80">
                {p.languages.map((l) => LANGUAGE_LABELS[l] ?? l).join(" · ")}
              </p>
            </div>
          </article>
        ))}
        {practitioners.length === 0 && (
          <p className="col-span-full rounded-2xl bg-soul-sand/40 p-8 text-center text-soul-brown">
            {t("notFound")}
          </p>
        )}
      </div>
    </div>
  );
}
