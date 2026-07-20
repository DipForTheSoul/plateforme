import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { getCurrentPractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent } from "@/app/actions/events";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event } from "@/types/database";

export const dynamic = "force-dynamic";

/** Liste des expériences du praticien (occurrences regroupées sous le parent). */
export default async function MyEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ depose?: string; modifie?: string }>;
}) {
  const practitioner = await getCurrentPractitioner();
  const flags = await searchParams;
  if (!practitioner) {
    return <p className="text-sm text-soul-bronze">Aucune fiche praticien.</p>;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("practitioner_id", practitioner.id)
    .is("parent_event_id", null)
    .order("start_date", { ascending: false });
  const events = (data as Event[]) ?? [];

  return (
    <div className="flex flex-col gap-6">
      {flags.depose && (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          Expérience déposée ! Didier la relit personnellement — vous recevrez un
          e-mail dès sa validation.
        </div>
      )}
      {flags.modifie && (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          Modifications enregistrées.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl text-soul-brown">Mes expériences</h2>
        {practitioner.credits > 0 && practitioner.status === "approved" && (
          <Link href="/espace-praticien/evenements/nouveau" className="btn-primary">
            Déposer une expérience
          </Link>
        )}
      </div>

      {events.length === 0 && (
        <p className="text-sm text-soul-bronze">
          Aucune expérience pour l&apos;instant — déposez la première !
        </p>
      )}

      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <div key={event.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="font-medium text-soul-brown">{event.title}</p>
              <p className="text-xs text-soul-bronze">
                {formatDate(event.start_date)} · {formatTime(event.start_date)}
                {event.recurrence && (
                  <span className="ml-2 rounded-full bg-soul-sand px-2 py-0.5">
                    récurrent ({event.recurrence_count ?? "?"}×)
                  </span>
                )}
              </p>
              {event.status === "rejected" && event.admin_message && (
                <p className="mt-1 text-xs italic text-red-700">
                  Message de Didier : {event.admin_message}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={event.status} />
              <Link
                href={`/espace-praticien/evenements/${event.id}`}
                className="text-sm text-soul-brown underline"
              >
                Modifier
              </Link>
              <form action={deleteEvent}>
                <input type="hidden" name="event_id" value={event.id} />
                <button type="submit" className="text-sm text-red-700 underline">
                  Supprimer
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
