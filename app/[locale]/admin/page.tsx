import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Tableau de bord admin : compteurs clés + analytics interne sans cookies. */
export default async function AdminDashboard() {
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    pendingEvents,
    pendingPractitioners,
    approvedEvents,
    contacts,
    views,
    topPages,
  ] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "pending").is("parent_event_id", null),
    supabase.from("practitioners").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
    supabase.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", since.toISOString()),
    supabase.from("page_views").select("path").gte("created_at", since.toISOString()).limit(2000),
  ]);

  // Top 8 des pages les plus vues (30 jours).
  const counts = new Map<string, number>();
  for (const row of (topPages.data as { path: string }[]) ?? []) {
    counts.set(row.path, (counts.get(row.path) ?? 0) + 1);
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);

  const cards = [
    { label: "Soumissions en attente", value: pendingEvents.count ?? 0, href: "/admin/soumissions", accent: true },
    { label: "Praticien·nes à valider", value: pendingPractitioners.count ?? 0, href: "/admin/praticiens", accent: true },
    { label: "Expériences en ligne", value: approvedEvents.count ?? 0, href: "/admin/soumissions" },
    { label: "Contacts newsletter", value: contacts.count ?? 0, href: "/admin/newsletter" },
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

      <div className="card p-6">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-lg text-soul-brown">Audience (30 jours)</h2>
          <p className="text-sm text-soul-bronze">
            {views.count ?? 0} pages vues — mesure interne sans cookies
          </p>
        </div>
        {top.length === 0 ? (
          <p className="text-sm text-soul-bronze">Pas encore de données.</p>
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
        <p className="mt-4 text-xs text-soul-bronze">
          {/* PLACEHOLDER — brancher Google Analytics 4 en mode cookieless si souhaité
              (aucune bannière nécessaire tant que la mesure reste sans cookies). */}
          Connexion Google Analytics : à brancher ultérieurement (mesure sans cookies).
        </p>
      </div>
    </div>
  );
}
