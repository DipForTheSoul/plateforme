import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FavoritesClient } from "./FavoritesClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "favorites" });
  return { title: t("title"), robots: { index: false } };
}

/** Favoris liés à l'appareil (Phase 5) — la liste vit côté client. */
export default async function FavoritesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("favorites");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl text-soul-brown">{t("title")}</h1>
      <p className="mt-2 max-w-2xl text-soul-bronze">{t("subtitle")}</p>
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
