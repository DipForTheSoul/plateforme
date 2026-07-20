import { Link } from "@/i18n/navigation";
import { getVenues } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Gestion des lieux (tous géocodés à la création). */
export default async function AdminVenuesPage() {
  const venues = await getVenues();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-soul-brown">Lieux ({venues.length})</h2>
        <Link href="/admin/lieux/nouveau" className="btn-primary">
          Ajouter un lieu
        </Link>
      </div>
      <div className="card divide-y divide-soul-bronze/10">
        {venues.length === 0 && (
          <p className="p-4 text-sm text-soul-bronze">Aucun lieu enregistré.</p>
        )}
        {venues.map((v) => (
          <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-medium text-soul-brown">{v.name}</p>
              <p className="text-xs text-soul-bronze">
                {v.address} · {v.canton ?? v.country}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs ${
              v.lat !== null ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}>
              {v.lat !== null ? "Géocodé ✓" : "Non géocodé !"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
