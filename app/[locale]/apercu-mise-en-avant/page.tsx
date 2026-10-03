import { FeaturedRequestCard } from "@/components/forms/FeaturedRequestCard";

export default function FeaturedRequestPreviewPage() {
  return (
    <main className="bg-soul-sand/35 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-soul-violet">Aperçu praticien</span>
          <h1 className="mt-2 font-serif text-3xl text-soul-brown sm:text-4xl">Déposer une expérience</h1>
          <p className="mt-3 text-soul-ink/75">La demande de mise en avant apparaît à la fin du formulaire, juste avant son envoi.</p>
        </div>

        <div className="card flex flex-col gap-5 p-5 sm:p-8">
          <div>
            <span className="label">Photos</span>
            <div className="mt-2 flex h-24 items-center justify-center rounded-2xl border border-dashed border-soul-bronze/35 bg-soul-sand/35 text-sm text-soul-bronze">
              Fin du formulaire de l’expérience
            </div>
          </div>

          <FeaturedRequestCard
            priceChf={20}
            durationDays={30}
            copy={{
              badge: "Option visibilité",
              title: "Mettre cette offre en avant",
              description: "Signalez à Didier que vous souhaitez mettre cette offre en avant sur ForTheSoul.",
              duration: "Mise en avant pendant {days} jours après validation.",
              priceLabel: "Supplément",
              choice: "Je souhaite la mise en avant",
              paymentHint: "Le paiement sera proposé après l’envoi de votre expérience.",
              selected: "Votre demande sera transmise avec l’expérience. Vous pourrez ensuite procéder au paiement.",
            }}
          />

          <button type="button" className="btn-primary self-start">Déposer pour validation (1 crédit)</button>
        </div>

        <p className="mt-5 text-xs text-soul-bronze">Aperçu de design uniquement : ce bouton ne transmet aucune donnée et ne déclenche aucun paiement.</p>
      </div>
    </main>
  );
}
