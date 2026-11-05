import type { Metadata } from "next";
import { getTranslations,setRequestLocale } from "next-intl/server";
import {pageAlternates} from '@/lib/metadata';
import { LegalPage } from "@/components/LegalPage";
import doc from "@/content/legal/confidentialite.json";

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;
  const t=await getTranslations({locale,namespace:'common'});
  return {title:locale==='fr'?"Politique de confidentialité — ForTheSoul":t('footer.privacy'),
    description:locale==='fr'?"Politique de confidentialité de la plateforme ForTheSoul.":t('footer.privacy'),
    alternates:pageAlternates('/confidentialite',locale)};
}

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
