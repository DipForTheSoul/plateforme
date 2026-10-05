import { FeaturedOfferPurchaseCard } from "@/components/forms/FeaturedOfferPurchaseCard";

export default function FeaturedRequestPreviewPage() {
  return (
    <main className="bg-soul-sand/35 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-soul-violet">Aperçu praticien</span>
          <h1 className="mt-2 font-serif text-3xl text-soul-brown sm:text-4xl">Mes expériences</h1>
          <p className="mt-3 text-soul-ink/75">Le praticien peut demander la mise en avant d’une offre déjà validée, directement depuis son tableau de bord.</p>
        </div>

        <div className="card flex flex-col gap-5 p-5 sm:p-8">
          <FeaturedOfferPurchaseCard />
        </div>

        <p className="mt-5 text-xs text-soul-bronze">Clique sur « Mettre en avant » pour afficher le parcours. Aperçu uniquement : aucun paiement n’est déclenché.</p>
      </div>
    </main>
  );
}
