import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentPractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { Event } from "@/types/database";

export const dynamic = "force-dynamic";

/** Tableau de bord praticien : solde, blocage à 0 crédit, stats rapides. */
export default async function PractitionerDashboard() {
  const practitioner = await getCurrentPractitioner();

  if (!practitioner) {
    return (
      <div className="card p-8 text-sm text-soul-brown">
        <p className="mb-4">
          Aucune fiche praticien n&apos;est encore liée à votre compte. Si vous
          venez de vous inscrire, elle est en cours de création — sinon,
          contactez Didier (welcome@forthesoul.ch).
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: events } = await supabase
    .from("events")
    .select("id, title, status, start_date, view_count, parent_event_id")
    .eq("practitioner_id", practitioner.id)
    .is("parent_event_id", null)
    .order("start_date", { ascending: false })
    .limit(5);

  const list = (events as Pick<Event, "id" | "title" | "status" | "start_date" | "view_count" | "parent_event_id">[]) ?? [];
  const outOfCredits = practitioner.credits === 0;

  return (
    <div className="flex flex-col gap-6">
      {practitioner.status === "pending" && (
        <div className="rounded-2xl border border-soul-amber/40 bg-soul-ivory p-5 text-sm text-soul-brown">
          Votre fiche est <strong>en cours de relecture par Didier</strong>. Vous
          pourrez publier vos expériences dès sa validation.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-soul-bronze">Solde de publications</p>
          <p className="mt-1 font-serif text-4xl text-soul-brown">
            {practitioner.credits}
          </p>
          <Link
            href="/espace-praticien/credits"
            className="mt-3 inline-block text-sm font-medium text-soul-terracotta underline"
          >
            Racheter un pack
          </Link>
        </div>
        <div className="card p-6">
          <p className="text-sm text-soul-bronze">Expériences déposées</p>
          <p className="mt-1 font-serif text-4xl text-soul-brown">{list.length}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-soul-bronze">Vues cumulées</p>
          <p className="mt-1 font-serif text-4xl text-soul-brown">
            {list.reduce((sum, e) => sum + (e.view_count ?? 0), 0)}
          </p>
        </div>
      </div>

      {outOfCredits ? (
        <div className="rounded-2xl border border-soul-terracotta/40 bg-soul-ivory p-5 text-sm text-soul-brown">
          <strong>Solde épuisé.</strong> Le dépôt de nouvelles expériences est
          bloqué tant que votre solde est à zéro.{" "}
          <Link href="/espace-praticien/credits" className="font-medium underline">
            Racheter un pack en 1 clic →
          </Link>
        </div>
      ) : (
        <Link href="/espace-praticien/evenements/nouveau" className="btn-primary self-start">
          Déposer une expérience
        </Link>
      )}

      <div className="card divide-y divide-soul-bronze/10">
        <p className="p-4 text-sm font-semibold text-soul-brown">Dernières expériences</p>
        {list.length === 0 && (
          <p className="p-4 text-sm text-soul-bronze">Aucune expérience pour l&apos;instant.</p>
        )}
        {list.map((e) => (
          <div key={e.id} className="flex items-center justify-between gap-4 p-4 text-sm">
            <div>
              <p className="font-medium text-soul-brown">{e.title}</p>
              <p className="text-xs text-soul-bronze">{formatDate(e.start_date)}</p>
            </div>
            <StatusBadge status={e.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
