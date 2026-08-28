import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

/** Tableau de bord admin : compteurs clés + analytics interne sans cookies. */
export default async function AdminDashboard() {
  const supabase = await createClient();
  const t = await getTranslations("admin");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    pendingEvents,
    pendingPractitioners,
    approvedEvents,
    rejectedEvents,
    activePractitioners,
    creditsConsumed,
    contacts,
    views,
    topPages,
    topExperiences,
  ] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "pending").is("parent_event_id", null),
    supabase.from("practitioners").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("practitioners").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("credit_transactions").select("id", { count: "exact", head: true }).eq("type", "consumption").gte("created_at", since.toISOString()),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", since.toISOString()),
    supabase.from("page_views").select("path").gte("created_at", since.toISOString()).limit(2000),
    supabase.from("events").select("title, slug, view_count").eq("status", "approved").order("view_count", { ascending: false }).limit(8),
  ]);
  const topExp = (topExperiences.data as { title: string; slug: string; view_count: number }[] ?? []).filter((e) => e.view_count > 0);

  const counts = new Map<string, number>();
  for (const row of (topPages.data as { path: string }[]) ?? []) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const cards = [
    { label: t("dashboard.pendingSubmissions"), value: pendingEvents.count ?? 0, href: "/admin/soumissions", accent: true },
    { label: t("dashboard.pendingPractitioners"), value: pendingPractitioners.count ?? 0, href: "/admin/praticiens", accent: true },
    { label: t("dashboard.eventsOnline"), value: approvedEvents.count ?? 0, href: "/admin/soumissions" },
    { label: t("dashboard.rejected"), value: rejectedEvents.count ?? 0, href: "/admin/soumissions" },
    { label: t("dashboard.activePractitioners"), value: activePractitioners.count ?? 0, href: "/admin/praticiens" },
    { label: t("dashboard.creditsConsumed30d"), value: creditsConsumed.count ?? 0, href: "/admin/credits" },
    { label: t("dashboard.newsletterContacts"), value: contacts.count ?? 0, href: "/admin/newsletter" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}
            className={`card p-6 ${card.accent && card.value > 0 ? "ring-2 ring-soul-terracotta/50" : ""}`}>
            <p className="text-sm text-soul-bronze">{card.label}</p>
            <p className="mt-1 font-serif text-4xl text-soul-brown">{card.value}</p>
          </Link>
        ))}
      </div>

      {topExp.length > 0 && (
        <div className="card p-6">
          <h2 className="mb-4 font-serif text-lg text-soul-brown">
            {t("dashboard.topExperiences")}
          </h2>
          <ul className="flex flex-col gap-2">
            {topExp.map((e) => (
              <li key={e.slug} className="flex items-center gap-3 text-sm">
                <span className="w-14 shrink-0 text-right font-medium text-soul-brown">
                  {e.view_count}
                </span>
                <div className="h-2 rounded-full bg-soul-violet/70"
                  style={{ width: `${Math.max(4, (e.view_count / topExp[0].view_count) * 60)}%` }} />
                <Link href={`/experiences/${e.slug}`} className="truncate text-soul-bronze hover:text-soul-violet">
                  {e.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-lg text-soul-brown">{t("dashboard.audience30d")}</h2>
          <p className="text-sm text-soul-bronze">
            {t("dashboard.pageViews", { count: views.count ?? 0 })}
          </p>
        </div>
        {top.length === 0 ? (
          <p className="text-sm text-soul-bronze">{t("dashboard.noData")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {top.map(([path, count]) => (
              <li key={path} className="flex items-center gap-3 text-sm">
                <span className="w-24 shrink-0 text-right font-medium text-soul-brown">{count}</span>
                <div className="h-2 rounded-full bg-soul-terracotta/70"
                  style={{ width: `${Math.max(4, (count / top[0][1]) * 60)}%` }} />
                <span className="truncate text-soul-bronze">{path}</span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-soul-bronze"
          dangerouslySetInnerHTML={{ __html: t.raw("dashboard.analyticsNote") }}
        />
      </div>
    </div>
  );
}
