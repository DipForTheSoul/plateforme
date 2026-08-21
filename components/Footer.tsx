import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { NewsletterForm } from "@/components/NewsletterForm";

export async function Footer() {
  const t = await getTranslations("common");
  const tContact = await getTranslations("contact");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-soul-bronze/15 bg-soul-sand text-soul-brown">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo-icon.png"
              alt=""
              width={44}
              height={37}
              className="h-11 w-auto"
            />
            <p className="font-serif text-3xl">ForTheSoul</p>
          </div>
          <p className="mt-3 text-sm text-soul-brown/70">{t("tagline")}</p>
        </div>

        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/experiences" className="hover:text-soul-violet">
            {t("nav.experiences")}
          </Link>
          <Link href="/praticiens" className="hover:text-soul-violet">
            {t("nav.practitioners")}
          </Link>
          <Link href="/lieux" className="hover:text-soul-violet">
            {t("nav.venues")}
          </Link>
          <Link href="/a-propos" className="hover:text-soul-violet">
            {t("nav.about")}
          </Link>
          <Link href="/inscription" className="hover:text-soul-violet">
            {t("footer.becomePractitioner")}
          </Link>
          <Link href="/contact" className="hover:text-soul-violet">
            {tContact("title")}
          </Link>
          <Link href="/cgu" className="hover:text-soul-violet">
            {t("footer.terms")}
          </Link>
          <Link href="/confidentialite" className="hover:text-soul-violet">
            {t("footer.privacy")}
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
      <div className="border-t border-soul-brown/10 py-4 text-center text-xs text-soul-brown/50">
        {t("footer.legal", { year })}
      </div>
    </footer>
  );
}
