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
            <p className="text-sm text-soul-bronze">Fondateur de ForTheSoul</p>
          </figcaption>
        </figure>

        <div className="flex flex-col gap-5 text-soul-ink/85">
          <p>
            ForTheSoul est née d’un besoin : rassembler en un même lieu celles et
            ceux qui proposent des expériences, celles et ceux qui recherchent des
            expériences authentiques qui nourrissent l’âme, et celles et ceux qui
            proposent des lieux pour les accueillir.
          </p>
          <p>
            L’objectif est de faciliter les connexions entre ces trois univers et
            de faire émerger une véritable communauté suisse, avec la possibilité
            de proposer également des expériences et des événements à l’étranger.
          </p>
          <p>
            Créateur de la <strong>Humanic Dance</strong> et d’expériences
            immersives, Didier a rencontré, dansé et partagé de nombreuses
            expériences avec les personnes présentes sur cette plateforme, comme
            co-créateur, danseur ou participant.
          </p>
          <p>
            C’est aussi ce qui fait la particularité de ForTheSoul : chaque
            praticien·ne et chaque expérience sont personnellement validés. Un
            choix plus lent et plus exigeant, mais qui permet de privilégier la
            qualité plutôt que la quantité.
          </p>
          <p>
            Retraites, danse extatique, méditation, voyages sonores, cercles,
            expériences immersives en Suisse ou à l’étranger : ForTheSoul rassemble
            des propositions qui invitent à ralentir, ressentir, explorer et
            revenir à ce qui compte vraiment.
          </p>
          <p>Merci de soutenir ForTheSoul par ta présence, tes expériences ou ton lieu.</p>
          <p className="rounded-2xl bg-soul-sand/40 p-5 font-serif text-lg italic text-soul-brown">
            « Je te souhaite de vivre les mêmes magnifiques expériences que celles
            que j’ai vécues. »
            <span className="mt-2 block text-sm not-italic text-soul-bronze">Didier</span>
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
