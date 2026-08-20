import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/LegalPage";
import cgu from "@/content/legal/cgu.json";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — ForTheSoul",
  description: "Conditions générales d'utilisation de la plateforme ForTheSoul.",
};

/**
 * CGU — contenu fourni par le client (Didier), rendu verbatim.
 * Pour mettre à jour : régénérer content/legal/cgu.json depuis le document source.
 */
export default async function CguPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage title={cgu.title} updated={cgu.updated} blocks={cgu.blocks as never} />;
}
