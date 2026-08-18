import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Conditions générales — ForTheSoul",
  description:
    "Conditions générales d'utilisation et de vente de la plateforme ForTheSoul.",
};

/**
 * Page légale statique (CGV / mentions légales) — lien dans le footer.
 * ⚠️ Le CONTENU JURIDIQUE est fourni par le client (Didier / son juriste) — cahier
 * des charges §7. Les blocs « [À compléter par l'éditeur] » sont des emplacements à
 * remplacer par le texte définitif. Page volontairement NON éditable en back-office
 * (des CGV changent rarement : on met à jour le texte sur demande).
 */
export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const placeholder = "[À compléter par l'éditeur]";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-3xl text-soul-brown sm:text-4xl">
        Conditions générales
      </h1>
      <p className="mt-3 text-sm text-soul-bronze">
        Dernière mise à jour&nbsp;: {placeholder}
      </p>

      <div className="mt-8 flex flex-col gap-8 text-soul-ink/85 leading-relaxed">
        <section>
          <h2 className="font-serif text-xl text-soul-brown">1. Éditeur</h2>
          <p className="mt-2">
            La plateforme ForTheSoul est éditée par {placeholder} (raison sociale,
            adresse, contact, numéro d&apos;entreprise/TVA le cas échéant).
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-soul-brown">2. Objet</h2>
          <p className="mt-2">
            ForTheSoul met en relation des praticien·nes et des participant·es autour
            d&apos;expériences de bien-être. {placeholder}
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-soul-brown">
            3. Publications et packs
          </h2>
          <p className="mt-2">
            Les praticien·nes achètent des packs de publications pour déposer leurs
            expériences. Conditions d&apos;achat, de validité et de remboursement&nbsp;:{" "}
            {placeholder}
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-soul-brown">4. Paiements</h2>
          <p className="mt-2">
            Les paiements en ligne sont traités par Stripe. {placeholder}
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-soul-brown">
            5. Données personnelles
          </h2>
          <p className="mt-2">
            Traitement des données, finalités et droits des utilisateur·rices&nbsp;:{" "}
            {placeholder}
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-soul-brown">6. Cookies</h2>
          <p className="mt-2">
            Ce site fonctionne <strong>sans cookies de suivi</strong>&nbsp;: la mesure
            d&apos;audience est anonyme et ne nécessite aucune bannière de consentement.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-xl text-soul-brown">7. Contact</h2>
          <p className="mt-2">
            Pour toute question relative aux présentes conditions&nbsp;: {placeholder}
          </p>
        </section>
      </div>
    </div>
  );
}
