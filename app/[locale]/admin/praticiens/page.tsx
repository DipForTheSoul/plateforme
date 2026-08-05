import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { moderatePractitioner } from "@/app/actions/admin";
import { StatusBadge } from "@/components/StatusBadge";
import type { Practitioner } from "@/types/database";

export const dynamic = "force-dynamic";

/** Validation des fiches praticiens (chaque praticien est validé par Didier). */
export default async function AdminPractitionersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("practitioners")
    .select("*")
    .order("created_at", { ascending: false });
  const practitioners = (data as Practitioner[]) ?? [];
  const pending = practitioners.filter((p) => p.status === "pending");
  const others = practitioners.filter((p) => p.status !== "pending");

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-xl text-soul-brown">À valider ({pending.length})</h2>
        {pending.length === 0 && (
          <p className="text-sm text-soul-bronze">Aucune fiche en attente.</p>
        )}
        <div className="flex flex-col gap-4">
          {pending.map((p) => (
            <div key={p.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link href={`/admin/praticiens/${p.id}`}
                    className="font-serif text-lg text-soul-brown underline decoration-soul-bronze/30 underline-offset-2 hover:decoration-soul-violet">
                    {p.name}
                  </Link>
                  <p className="text-sm text-soul-bronze">
                    {p.specialties.join(" · ") || "Spécialités non renseignées"} ·{" "}
                    {p.contact.email ?? "e-mail inconnu"}
                  </p>
                </div>
                <StatusBadge status={p.status} />
              </div>
              {p.bio && <p className="mt-3 line-clamp-3 text-sm text-soul-ink/80">{p.bio}</p>}
              <form action={moderatePractitioner} className="mt-4 flex flex-col gap-3">
                <input type="hidden" name="practitioner_id" value={p.id} />
                <input type="text" name="message"
                  placeholder="Motif en cas de refus (envoyé par e-mail au/à la praticien·ne)"
                  className="field" />
                <div className="flex flex-wrap gap-3">
                  <button type="submit" name="decision" value="approved"
                    className="btn-primary min-h-12 flex-1 sm:flex-none">
                    ✓ Valider la fiche
                  </button>
                  <button type="submit" name="decision" value="rejected"
                    className="min-h-12 flex-1 rounded-full border border-red-300 bg-white px-6 text-sm font-medium text-red-700 hover:bg-red-50 sm:flex-none">
                    ✕ Refuser (avec motif)
                  </button>
                </div>
              </form>
              <Link href={`/admin/praticiens/${p.id}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-soul-violet underline">
                ✎ Modifier la fiche
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">Toutes les fiches</h2>
        <div className="card divide-y divide-soul-bronze/10">
          {others.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <Link href={`/admin/praticiens/${p.id}`}
                  className="font-medium text-soul-brown underline decoration-soul-bronze/30 underline-offset-2 hover:decoration-soul-violet">
                  {p.name}
                </Link>
                <p className="text-xs text-soul-bronze">
                  {p.credits} crédit{p.credits > 1 ? "s" : ""} · {p.contact.email ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={p.status} />
                <Link href={`/admin/praticiens/${p.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-soul-violet/30 bg-soul-violet/5 px-3 py-1 text-xs font-medium text-soul-violet">
                  ✎ Modifier
                </Link>
                <form action={moderatePractitioner}>
                  <input type="hidden" name="practitioner_id" value={p.id} />
                  <button type="submit" name="decision"
                    value={p.status === "approved" ? "rejected" : "approved"}
                    className="text-xs text-soul-bronze underline">
                    {p.status === "approved" ? "Suspendre" : "Réactiver"}
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
