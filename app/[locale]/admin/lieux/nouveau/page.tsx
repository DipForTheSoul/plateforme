import { VenueForm } from "./VenueForm";

export const dynamic = "force-dynamic";

export default function NewVenuePage() {
  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-2 text-xl text-soul-brown">Nouveau lieu</h2>
      <p className="mb-6 text-sm text-soul-bronze">
        L&apos;adresse est géocodée automatiquement à la création (Nominatim /
        OpenStreetMap) — indispensable pour la recherche par rayon.
      </p>
      <VenueForm />
    </div>
  );
}
