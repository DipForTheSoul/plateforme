import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import doc from "@/content/legal/confidentialite.json";

export const metadata: Metadata = {
  title: "Politique de confidentialité — ForTheSoul",
  description: "Politique de confidentialité de la plateforme ForTheSoul.",
};

/** Politique rendue depuis le contenu structuré de content/legal/confidentialite.json. */
export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage title={doc.title} updated={doc.updated} blocks={doc.blocks as never} />;
}
