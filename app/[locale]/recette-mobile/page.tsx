import { ContactRequestResults } from "@/components/admin/ContactRequestResults";
import { FeaturedRequestCard } from "@/components/forms/FeaturedRequestCard";

export default function MobileReviewPage() {
  return (
    <main className="mx-auto min-w-0 max-w-xl px-4 py-8 [overflow-wrap:anywhere]">
      <div className="rounded-2xl border border-soul-violet/20 bg-white p-4 text-sm text-soul-brown">
        <strong>Recette locale mobile</strong>
        <p className="mt-1 text-soul-bronze">
          Données fictives. Vérifie uniquement l’affichage et n’enregistre aucun formulaire.
        </p>
      </div>

      <section className="mt-8">
        <h1 className="text-2xl text-soul-brown">Demande de mise en avant — formulaire praticien</h1>
        <p className="mt-2 text-sm text-soul-bronze">
          Maquette interactive uniquement : le choix ci-dessous ne déclenche aucun paiement et n’enregistre aucune donnée.
        </p>
        <div className="mt-5">
          <FeaturedRequestCard
            priceChf={20}
            durationDays={30}
            copy={{
              badge: "Option visibilité",
              title: "Mettre cette offre en avant",
              description: "Votre expérience pourra apparaître dans la sélection mise en avant de ForTheSoul après sa validation par Didier.",
              duration: "Mise en avant pendant {days} jours après validation.",
              priceLabel: "Supplément",
              choice: "Je souhaite la mise en avant",
              paymentHint: "Le paiement sera proposé après l’envoi de votre expérience.",
              selected: "Option sélectionnée — vous serez dirigé·e vers le paiement après l’envoi.",
            }}
          />
        </div>
      </section>

      <section className="mt-12">
        <h1 className="text-2xl text-soul-brown">Contacts praticiens — vue administrateur mobile</h1>
        <p className="mt-2 text-sm text-soul-bronze">
          Le contact doit être entièrement lisible sous forme de carte, sans texte coupé ni défilement horizontal.
        </p>
        <ContactRequestResults forceMobile rows={[{
          id: "recette-contact",
          created_at: "2026-09-30T08:30:00.000Z",
          visitor_name: "Camille Exemple",
          visitor_email: "camille.exemple.avec.une.adresse.longue@example.com",
          visitor_phone: "+41 79 123 45 67",
          message: "Bonjour, je souhaite davantage d’informations sur cette expérience et connaître les prochaines disponibilités.",
          newsletter_consent: true,
          send_status: "sent",
          practitioner: { name: "Praticienne Exemple" },
        }]} />
      </section>

    </main>
  );
}
