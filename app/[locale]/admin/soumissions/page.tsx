import { createClient } from "@/lib/supabase/server";
import { Link } from "@/i18n/navigation";
import { moderateEvent } from "@/app/actions/admin";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import type { EventWithRelations } from "@/types/database";
import { EVENT_WITH_RELATIONS } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function SubmissionsPage() {
  const supabase = await createClient();
  const t = await getTranslations("admin.submissions");

  const { data } = await supabase
    .from("events")
    .select(EVENT_WITH_RELATIONS)
    .is("parent_event_id", null)
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(100);

  const events = ((data as unknown as EventWithRelations[]) ?? []);
  const pending = events.filter((e) => e.status === "pending");
  const others = events.filter((e) => e.status !== "pending");

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl text-soul-brown">{t("title")}</h1>
        <Link href="/admin/soumissions/nouveau" className="btn-primary">
          {t("createEvent")}
        </Link>
      </div>

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">
          {t("pending", { count: pending.length })}
        </h2>
        {pending.length === 0 && (
          <p className="text-sm text-soul-bronze">{t("nothingPending")}</p>
        )}
        <div className="flex flex-col gap-4">
          {pending.map((event) => (
            <SubmissionCard key={event.id} event={event} t={t} showActions />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">{t("history")}</h2>
        <div className="flex flex-col gap-4">
          {others.map((event) => (
            <SubmissionCard key={event.id} event={event} t={t} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SubmissionCard({
  event,
  t,
  showActions = false,
}: {
  event: EventWithRelations;
  t: Awaited<ReturnType<typeof getTranslations<"admin.submissions">>>;
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
            {event.recurrence && <> · {t("recurrent", { count: event.recurrence_count ?? 0 })}</>}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={event.status} />
          <Link
            href={`/admin/soumissions/${event.id}`}
            className="inline-flex items-center gap-1 rounded-full border border-soul-violet/30 bg-soul-violet/5 px-3 py-1 text-xs font-medium text-soul-violet"
          >
            ✎ {t("edit")}
          </Link>
        </div>
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
            placeholder={t("messagePlaceholder")}
            className="field"
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" name="decision" value="approved"
              className="btn-primary min-h-12 flex-1 sm:flex-none">
              ✓ {t("approve")}
            </button>
            <button type="submit" name="decision" value="rejected"
              className="min-h-12 flex-1 rounded-full border border-red-300 bg-white px-6 text-sm font-medium text-red-700 hover:bg-red-50 sm:flex-none">
              ✕ {t("reject")}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          {event.status === "approved" && event.is_top && (
            <span className="text-xs font-medium text-soul-violet">★ {t("featuredBadge")}</span>
          )}
          <form action={moderateEvent}>
            <input type="hidden" name="event_id" value={event.id} />
            <button type="submit" name="decision"
              value={event.status === "approved" ? "rejected" : "approved"}
              className="text-sm text-soul-bronze underline">
              {event.status === "approved" ? t("unpublish") : t("republish")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
