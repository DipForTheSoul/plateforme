import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCurrentProfile } from "@/lib/auth";
import { FavoritesClient } from "@/app/[locale]/favoris/FavoritesClient";

export const dynamic = "force-dynamic";

/**
 * Espace participant (FR) — réservé à toute personne connectée. Regroupe ses
 * expériences enregistrées (favoris, liés à l'appareil) et la déconnexion.
 */
export default async function ParticipantSpace({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  if (!profile) redirect("/connexion");

  const t = await getTranslations("favorites");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-soul-brown">Mon espace</h1>
          <p className="mt-1 text-sm text-soul-bronze">{profile.email}</p>
        </div>
        {/* Lien direct vers la route serveur de déconnexion (insensible au cache). */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/api/logout" className="text-sm text-soul-bronze underline">
          Se déconnecter
        </a>
      </div>

      <h2 className="text-xl text-soul-brown">Mes expériences enregistrées</h2>
      <p className="mt-1 max-w-2xl text-sm text-soul-bronze">
        Retrouvez vos coups de cœur et ajoutez-les à votre agenda en un clic. Vos
        favoris sont enregistrés sur cet appareil.
      </p>

      <FavoritesClient
        labels={{
          events: t("events"),
          practitioners: t("practitioners"),
          empty: t("empty"),
        }}
      />
    </div>
  );
}
