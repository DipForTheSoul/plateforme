import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import doc from "@/content/legal/confidentialite.json";

export const metadata: Metadata = {
  title: "Politique de confidentialité — ForTheSoul",
  description: "Politique de confidentialité de la plateforme ForTheSoul.",
};

/**
 * Politique de confidentialité — contenu fourni par le client (Didier), verbatim.
 * Pour mettre à jour : régénérer content/legal/confidentialite.json depuis la source.
 */
export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage title={doc.title} updated={doc.updated} blocks={doc.blocks as never} />;
}
