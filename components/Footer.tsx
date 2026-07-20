import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/NewsletterForm";

export async function Footer() {
  const t = await getTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-soul-bronze/15 bg-soul-brown text-soul-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-icon.png"
              alt=""
              width={36}
              height={30}
              className="h-8 w-auto"
            />
            <p className="font-serif text-2xl">ForTheSoul</p>
          </div>
          <p className="mt-3 text-sm text-soul-sand/80">{t("tagline")}</p>
          <p className="mt-4 text-sm italic text-soul-bronze">{t("footer.curated")}</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/experiences" className="hover:text-soul-amber">
            {t("nav.experiences")}
          </Link>
          <Link href="/praticiens" className="hover:text-soul-amber">
            {t("nav.practitioners")}
          </Link>
          <Link href="/a-propos" className="hover:text-soul-amber">
            {t("nav.about")}
          </Link>
          <Link href="/inscription" className="hover:text-soul-amber">
            {t("footer.becomePractitioner")}
          </Link>
        </nav>

        <div>
          <p className="mb-3 font-serif text-lg">{t("footer.newsletterTitle")}</p>
          <NewsletterForm
            placeholder={t("footer.newsletterPlaceholder")}
            consentLabel={t("footer.newsletterConsent")}
            buttonLabel={t("footer.newsletterButton")}
            successMessage={t("footer.newsletterSuccess")}
            errorMessage={t("footer.newsletterError")}
          />
        </div>
      </div>
      <div className="border-t border-soul-cream/10 py-4 text-center text-xs text-soul-sand/60">
        {t("footer.legal", { year })}
      </div>
    </footer>
  );
}
