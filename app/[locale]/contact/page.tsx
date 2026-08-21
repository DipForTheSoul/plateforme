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

  // Bouton WhatsApp (le numéro n'est jamais affiché en clair, seulement dans le lien wa.me).
  const whatsappHref = `https://wa.me/41787938872?text=${encodeURIComponent(
    "Bonjour, je vous contacte depuis le site ForTheSoul."
  )}`;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-serif text-3xl text-soul-brown sm:text-4xl">{t("title")}</h1>
      <p className="mt-2 text-soul-bronze">{t("subtitle")}</p>
      <div className="mt-8">
        <ContactForm />
      </div>

      <div className="mt-8 border-t border-soul-bronze/15 pt-8">
        <p className="text-sm font-medium text-soul-brown">{t("whatsappTitle")}</p>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
            <path d="M17.5 14.4c-.3-.15-1.8-.9-2.07-1-.28-.1-.48-.15-.68.15-.2.3-.78 1-.96 1.2-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.13-.14.3-.35.45-.53.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.53.07-.8.38-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.24 5.13 4.54.72.3 1.27.5 1.7.64.72.23 1.37.2 1.88.12.57-.08 1.8-.73 2.05-1.44.25-.7.25-1.3.18-1.44-.07-.13-.27-.2-.57-.35zM12 2C6.48 2 2 6.48 2 12c0 1.77.46 3.42 1.28 4.86L2 22l5.25-1.38A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
          {t("whatsappButton")}
        </a>
        <p className="mt-2 text-xs text-soul-bronze">{t("whatsappHint")}</p>
      </div>
    </div>
  );
}
