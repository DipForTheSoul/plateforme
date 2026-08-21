import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: `${t("title")} — ForTheSoul`, description: t("subtitle") };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("contact");

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-serif text-3xl text-soul-brown sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-soul-bronze">{t("subtitle")}</p>
      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
