import { createClient } from "@/lib/supabase/server";
import { moderateEvent, toggleTopListing } from "@/app/actions/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import type { EventWithRelations } from "@/types/database";
import { EVENT_WITH_RELATIONS } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * File de validation des expériences : validation / refus / publication en
 * 1 clic, utilisable au pouce sur mobile (boutons larges).
 */
export default async function SubmissionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_WITH_RELATIONS)
    .is("parent_event_id", null)
    .order("status", { ascending: true })   // pending d'abord (ordre alphabétique utile)
    .order("created_at", { ascending: false })
    .limit(100);

  const events = ((data as unknown as EventWithRelations[]) ?? []);
  const pending = events.filter((e) => e.status === "pending");
  const others = events.filter((e) => e.status !== "pending");

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h2 className="mb-4 text-xl text-soul-brown">
          En attente ({pending.length})
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-soul-bronze">Rien à valider — tout est à jour ✨</p>
        )}
        <div className="flex flex-col gap-4">
          {pending.map((event) => (
            <SubmissionCard key={event.id} event={event} showActions />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">Historique</h2>
        <div className="flex flex-col gap-4">
          {others.map((event) => (
            <SubmissionCard key={event.id} event={event} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({
  event,
  showActions = false,
}: {
  event: EventWithRelations;
  showActions?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-lg text-soul-brown">{event.title}</p>
          <p className="text-sm text-soul-bronze">
            {event.practitioner?.name ?? "?"} · {event.category?.name ?? "—"} ·{" "}
            {formatDate(event.start_date)} {formatTime(event.start_date)}
            {event.venue && <> · {event.venue.name}</>}
            {event.recurrence && <> · récurrent ({event.recurrence_count}×)</>}
          </p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      {event.description && (
        <p className="mt-3 line-clamp-3 text-sm text-soul-ink/80">{event.description}</p>
      )}

      {showActions ? (
        <form action={moderateEvent} className="mt-4 flex flex-col gap-3">
          <input type="hidden" name="event_id" value={event.id} />
          <input
            type="text"
            name="message"
            placeholder="Message au praticien (optionnel — joint à l'e-mail)"
            className="field"
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" name="decision" value="approved"
              className="btn-primary min-h-12 flex-1 sm:flex-none">
              ✓ Valider &amp; publier
            </button>
            <button type="submit" name="decision" value="rejected"
              className="min-h-12 flex-1 rounded-full border border-red-300 bg-white px-6 text-sm font-medium text-red-700 hover:bg-red-50 sm:flex-none">
              ✕ Refuser
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          {event.status === "approved" && (
            <form action={toggleTopListing}>
              <input type="hidden" name="event_id" value={event.id} />
              <input type="hidden" name="is_top" value={String(event.is_top)} />
              <button type="submit" className="text-sm text-soul-terracotta underline">
                {event.is_top ? "★ Retirer du top" : "☆ Mettre en top listing"}
              </button>
            </form>
          )}
          <form action={moderateEvent}>
            <input type="hidden" name="event_id" value={event.id} />
            <button type="submit" name="decision"
              value={event.status === "approved" ? "rejected" : "approved"}
              className="text-sm text-soul-bronze underline">
              {event.status === "approved" ? "Dépublier" : "Republier"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
