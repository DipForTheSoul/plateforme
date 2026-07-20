import type { Metadata } from "next";
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
        {/* PLACEHOLDER — à remplacer par une vraie photo de Didier :
            déposer public/didier.jpg puis remplacer ce bloc par
            <Image src="/didier.jpg" alt="Didier Picamoles" … /> */}
        <div
          className="flex aspect-[4/5] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center text-soul-cream"
          style={{
            background: "linear-gradient(160deg, #443420 0%, #9e7c52 60%, #fdead2 100%)",
          }}
        >
          <span className="text-6xl">🌿</span>
          <p className="font-serif text-xl">Didier Picamoles</p>
          <p className="text-sm text-soul-sand/80">Fondateur de ForTheSoul</p>
        </div>

        <div className="flex flex-col gap-5 text-soul-ink/85">
          <p>
            ForTheSoul est née d&apos;une conviction simple : les expériences qui
            transforment ne se choisissent pas avec un algorithme, mais avec le
            cœur. Créateur de la <strong>Humanic Dance</strong> et facilitateur
            de voyages sonores depuis Neuchâtel, Didier Picamoles a rencontré,
            dansé et respiré avec chacune des personnes présentes sur cette
            plateforme.
          </p>
          <p>
            Ici, pas de catalogue infini ni de places achetées : chaque
            praticien·ne et chaque expérience sont <strong>validés
            personnellement par Didier</strong>. C&apos;est plus lent, c&apos;est
            plus exigeant — et c&apos;est exactement pour cela que vous pouvez
            réserver les yeux fermés.
          </p>
          <p>
            De la danse extatique aux bains de gongs, des retraites de silence en
            Valais aux immersions dans la jungle du Costa Rica, ForTheSoul
            rassemble une communauté suisse et internationale qui partage la même
            intention : se retrouver, ensemble, en profondeur.
          </p>
          <p className="rounded-2xl bg-soul-sand/40 p-5 font-serif text-lg italic text-soul-brown">
            « Ce que je valide, je l&apos;ai vécu. Ce que je recommande, je le
            recommanderais à mes proches. » — Didier
            {/* PLACEHOLDER — citation à valider avec Didier */}
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Link href="/experiences" className="btn-accent">
              Découvrir les expériences
            </Link>
            <Link href="/inscription" className="btn-secondary">
              Rejoindre en tant que praticien·ne
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
