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
          <Link key={v.id} href={`/admin/lieux/${v.id}`}
            className="group flex flex-wrap items-center justify-between gap-3 p-4 text-sm transition hover:bg-soul-sand/40">
            <div>
              <p className="font-medium text-soul-brown">{v.name}</p>
              <p className="text-xs text-soul-bronze">
                {v.address} · {v.city ? `${v.city}, ` : ""}{v.canton ?? v.country}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs ${
                v.lat !== null ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}>
                {v.lat !== null ? "Géocodé ✓" : "Non géocodé !"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-soul-violet/30 bg-soul-violet/5 px-3 py-1 text-xs font-medium text-soul-violet">
                ✎ Modifier
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
