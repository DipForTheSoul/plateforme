import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toggleTopListing, extendFeatured } from "@/app/actions/admin";
import { SettingNumberForm } from "@/components/admin/SettingNumberForm";
import { formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

type Row = {
  id: string;
  title: string;
  is_top: boolean;
  featured_until: string | null;
};

export default async function AdminFeaturedPage() {
  await requireRole(["admin"]);
  const t = await getTranslations("admin.featured");
  const tc = await getTranslations("admin.common");

  const supabase = await createClient();
  const [{ data: settingData }, { data: featuredData }, { data: candidateData }] =
    await Promise.all([
      supabase.from("settings").select("value").eq("key", "featured_default_days").maybeSingle(),
      supabase
        .from("events")
        .select("id, title, is_top, featured_until")
        .eq("status", "approved")
        .eq("is_top", true)
        .is("parent_event_id", null)
        .order("featured_until", { ascending: true, nullsFirst: false }),
      supabase
        .from("events")
        .select("id, title, is_top, featured_until")
        .eq("status", "approved")
        .eq("is_top", false)
        .is("parent_event_id", null)
        .order("start_date", { ascending: true })
        .limit(200),
    ]);

  const defaultDays = (settingData as { value: string } | null)?.value ?? "30";
  const featured = (featuredData as Row[]) ?? [];
  const candidates = (candidateData as Row[]) ?? [];
  const now = new Date();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-xl text-soul-brown">{t("title")}</h2>
        <p className="mt-1 text-sm text-soul-bronze">
          {t("description")}
        </p>
      </div>

      <section className="card p-6">
        <SettingNumberForm
          settingKey="featured_default_days"
          label={t("defaultDuration")}
          hint={t("defaultDurationHint")}
          defaultValue={defaultDays}
          suffix={tc("days")}
          saveLabel={tc("save")}
        />
      </section>

      <section>
        <h3 className="mb-3 font-serif text-lg text-soul-brown">
          {t("currentlyFeatured", { count: featured.length })}
        </h3>
        {featured.length === 0 ? (
          <p className="text-sm text-soul-bronze">{t("noFeatured")}</p>
        ) : (
          <div className="card divide-y divide-soul-bronze/10">
            {featured.map((e) => {
              const expired = e.featured_until ? new Date(e.featured_until) < now : false;
              return (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                  <div>
                    <p className="font-medium text-soul-brown">{e.title}</p>
                    <p className="text-xs text-soul-bronze">
                      {e.featured_until
                        ? `${t("until", { date: formatDate(e.featured_until) })}${expired ? ` — ${t("expired").toLowerCase()}` : ""}`
                        : t("noEndDate")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      expired ? "bg-red-100 text-red-700" : "bg-soul-violet/10 text-soul-violet"
                    }`}>
                      {expired ? t("expired") : t("active")}
                    </span>
                    <form action={extendFeatured}>
                      <input type="hidden" name="event_id" value={e.id} />
                      <button type="submit" className="text-xs text-soul-violet underline">
                        {t("extend")}
                      </button>
                    </form>
                    <form action={toggleTopListing}>
                      <input type="hidden" name="event_id" value={e.id} />
                      <input type="hidden" name="is_top" value="true" />
                      <button type="submit" className="text-xs text-soul-bronze underline">
                        {t("remove")}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {candidates.length > 0 && (
        <section className="card p-6">
          <h3 className="mb-3 font-serif text-lg text-soul-brown">{t("addFeatured")}</h3>
          <form action={toggleTopListing} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="is_top" value="false" />
            <select name="event_id" required className="field !max-w-md">
              <option value="">{t("chooseExperience")}</option>
              {candidates.map((e) => (
                <option key={e.id} value={e.id}>{e.title}</option>
              ))}
            </select>
            <button type="submit" className="btn-primary !py-2">{t("featureButton")}</button>
          </form>
        </section>
      )}
    </div>
  );
}
