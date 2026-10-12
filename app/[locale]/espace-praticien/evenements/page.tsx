import { getLocale, getTranslations } from "next-intl/server";
import { readPages } from '@/lib/read-pages';
import { Link } from "@/i18n/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { NewEventDraftCard } from "@/components/forms/NewEventDraftCard";
import { getCurrentPractitioner } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteEvent } from "@/app/actions/events";
import { formatDate, formatTime } from "@/lib/utils";
import type { Event, Locale } from "@/types/database";
import { BuyFeaturedButton } from "./BuyFeaturedButton";

export const dynamic = "force-dynamic";

/** Liste des expériences du praticien (occurrences regroupées sous le parent). */
export default async function MyEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ depose?: string; modifie?: string; mise_en_avant?: string }>;
}) {
  const t = await getTranslations("practitioner");
  const locale = await getLocale() as Locale;
  const practitioner = await getCurrentPractitioner();
  const flags = await searchParams;
  if (!practitioner) {
    return <p className="text-sm text-soul-bronze">{t("noProfileShort")}</p>;
  }

  const supabase = await createClient();
  const data = await readPages((from,to)=>supabase
    .from("events")
    .select("*")
    .eq("practitioner_id", practitioner.id)
    .is("parent_event_id", null)
    .order("start_date", { ascending: false }).order('id').range(from,to));
  const events = (data as Event[]) ?? [];
  const {data:featuredSettings,error:featuredSettingsError}=await supabase.from("settings").select("key,value").in("key",["featured_price_chf","featured_default_days"]);
  if(featuredSettingsError)throw new Error("L’option de mise en avant est momentanément indisponible.");
  const settings=Object.fromEntries((featuredSettings??[]).map(row=>[row.key,row.value]));
  const featuredPrice=Number(settings.featured_price_chf??"20");
  const featuredDays=Number(settings.featured_default_days??"30");

  return (
    <div className="flex flex-col gap-6">
      {flags.depose && (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          {t("flagDeposited")}
        </div>
      )}
      {flags.modifie && (
        <div className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">
          {t("flagModified")}
        </div>
      )}
      {flags.mise_en_avant === "succes" && <div role="status" className="rounded-2xl border border-green-300 bg-green-50 p-4 text-sm text-green-800">{t("featuredPurchaseSuccess")}</div>}
      {flags.mise_en_avant === "annule" && <div className="rounded-2xl border border-soul-amber/50 bg-soul-ivory p-4 text-sm text-soul-brown">{t("featuredPurchaseCancelled")}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-xl text-soul-brown">{t("navEvents")}</h2>
        {practitioner.credits > 0 && practitioner.status === "approved" && (
          <Link href="/espace-praticien/evenements/nouveau" className="btn-primary">
            {t("submitExperience")}
          </Link>
        )}
      </div>

      <NewEventDraftCard owner={practitioner.id} />

      {events.length === 0 && (
        <p className="text-sm text-soul-bronze">
          {practitioner.status === "approved" ? t("noEventsFirst") : t("noEventsNeedApproval")}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {events.map((event) => (
          <div key={event.id} className="card flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="font-medium text-soul-brown">{event.title}</p>
              <p className="text-xs text-soul-bronze">
                {formatDate(event.start_date,locale)} · {formatTime(event.start_date)}
                {event.recurrence && (
                  <span className="ml-2 rounded-full bg-soul-sand px-2 py-0.5">
                    {t("recurrent", { count: event.recurrence_count ?? "?" })}
                  </span>
                )}
              </p>
              {event.status === "rejected" && event.admin_message && (
                <p className="mt-1 text-xs italic text-red-700">
                  {t("messageFromDidier", { message: event.admin_message })}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3">
              {event.is_top && event.status === "approved" && (
                <span className="text-xs font-medium text-soul-terracotta">
                  {t("featured")}
                </span>
              )}
              <StatusBadge status={event.status} />
              {event.status === "approved" && !event.is_top && Number.isFinite(featuredPrice) && Number.isInteger(featuredDays) && (
                <BuyFeaturedButton eventId={event.id} pendingLabel={t("featuredPaymentOpening")} label={t("featuredPurchase",{price:featuredPrice,days:featuredDays})}/>
              )}
              <Link
                href={`/espace-praticien/evenements/${event.id}`}
                className="text-sm text-soul-brown underline"
              >
                {t("edit")}
              </Link>
              <form action={deleteEvent}>
                <input type="hidden" name="event_id" value={event.id} />
                <button type="submit" className="text-sm text-red-700 underline">
                  {t("delete")}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
