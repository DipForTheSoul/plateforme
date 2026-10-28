import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { Suspense } from 'react';
import { AdminExperienceViews } from './ExperienceViews';
import {AdminAudienceFollowup} from './AudienceFollowup';

export const dynamic = "force-dynamic";

/** Tableau de bord : compteurs métier et mesure d'audience indépendante. */
export async function AdminCards() {
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
  ] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "pending").is("parent_event_id", null),
    supabase.from("practitioners").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("practitioners").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("credit_transactions").select("id", { count: "exact", head: true }).eq("type", "consumption").gte("created_at", since.toISOString()),
    supabase.from("contacts").select("id", { count: "exact", head: true }),
  ].map(query=>query.abortSignal(AbortSignal.timeout(4000))));
  if ([pendingEvents,pendingPractitioners,approvedEvents,rejectedEvents,activePractitioners,creditsConsumed,contacts].some(result=>result.error)) {
    return <p role="status">{t('dashboard.unavailable')}</p>;
  }


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

    </div>
  );
}

export default async function AdminDashboard() {
  const t=await getTranslations('admin');
  return <div className="flex flex-col gap-8">
    <Suspense fallback={<p role="status">{t('dashboard.loading')}</p>}><AdminCards /></Suspense>
    <Suspense fallback={<p role="status">{t('dashboard.audience30d')}…</p>}><AdminAudienceFollowup compact/></Suspense>
    <Suspense fallback={<p role="status">{t('dashboard.topExperiences')}…</p>}><AdminExperienceViews /></Suspense>
  </div>;
}
