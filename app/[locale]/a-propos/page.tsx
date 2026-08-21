import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/JsonLd";
import { organizationJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("title"), description: t("metaDescription") };
}

/**
 * Page « À propos » incarnée (Phase 9 — la touche Didier).
 * Les textes FR font foi ; contenu volontairement rédigé (pas de lorem ipsum).
 * // PLACEHOLDER — les paragraphes sont à relire/ajuster avec Didier, et la
 * // photo (public/didier.jpg) est à fournir par Rodrigue.
 */
export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <JsonLd data={organizationJsonLd()} />
      <h1 className="text-4xl text-soul-brown">{t("title")}</h1>

      <div className="mt-10 grid gap-10 md:grid-cols-[300px_1fr]">
        <figure className="m-0">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-xl shadow-soul-brown/15 ring-1 ring-soul-bronze/15">
            <Image
              src="/didier-desert.jpg"
              alt="Didier Picamoles, fondateur de ForTheSoul"
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className="object-cover"
              priority
            />
          </div>
          <figcaption className="mt-3 text-center">
            <p className="font-serif text-lg text-soul-brown">Didier Picamoles</p>
            <p className="text-sm text-soul-bronze">{t("role")}</p>
          </figcaption>
        </figure>

        <div className="flex flex-col gap-5 text-soul-ink/85">
          <p>{t("p1")}</p>
          <p>{t("p2")}</p>
          <p>{t.rich("p3", { b: (chunks) => <strong>{chunks}</strong> })}</p>
          <p>{t("p4")}</p>
          <p>{t("p5")}</p>
          <p>{t("thanks")}</p>
          <p className="rounded-2xl bg-soul-sand/40 p-5 font-serif text-lg italic text-soul-brown">
            « {t("quote")} »
            <span className="mt-2 block text-sm not-italic text-soul-bronze">{t("quoteAuthor")}</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/experiences" className="btn-accent">
              {t("ctaDiscover")}
            </Link>
            <Link href="/inscription" className="btn-secondary">
              {t("ctaJoin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
