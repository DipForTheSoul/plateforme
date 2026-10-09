import { PreviousFeaturedOfferPreview } from "@/components/forms/PreviousFeaturedOfferPreview";

export default function PreviousFeaturedRequestPreviewPage() {
  return (
    <main className="bg-soul-sand/35 px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-soul-violet">Ancienne proposition</span>
          <h1 className="mt-2 font-serif text-3xl text-soul-brown sm:text-4xl">Mes expériences</h1>
          <p className="mt-3 text-soul-ink/75">Version présentée avant les derniers retours de Didier.</p>
        </div>
        <div className="card p-5 sm:p-8"><PreviousFeaturedOfferPreview /></div>
        <p className="mt-5 text-xs text-soul-bronze">Ancienne prévisualisation uniquement : aucun paiement n’est déclenché.</p>
      </div>
    </main>
  );
}
