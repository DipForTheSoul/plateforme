import type { Metadata } from "next";
import { getTranslations,setRequestLocale } from "next-intl/server";
import {pageAlternates} from '@/lib/metadata';
import { LegalPage } from "@/components/LegalPage";
import cgu from "@/content/legal/cgu.json";

export async function generateMetadata({params}:{params:Promise<{locale:string}>}):Promise<Metadata>{
  const {locale}=await params;
  const t=await getTranslations({locale,namespace:'common'});
  return {title:locale==='fr'?"Conditions générales d'utilisation — ForTheSoul":t('footer.terms'),
    description:locale==='fr'?"Conditions générales d'utilisation de la plateforme ForTheSoul.":t('footer.terms'),
    alternates:pageAlternates('/cgu',locale)};
}

/** CGU rendues depuis le contenu structuré de content/legal/cgu.json. */
export default async function CguPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <LegalPage title={cgu.title} updated={cgu.updated} blocks={cgu.blocks as never} />;
}
