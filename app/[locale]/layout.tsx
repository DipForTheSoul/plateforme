import type { Metadata } from "next";
import { Playfair_Display, Work_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileTabBar } from "@/components/MobileTabBar";
import { PageViewTracker } from "@/components/PageViewTracker";
import { getCurrentProfile } from "@/lib/auth";
import "../globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthesoul.ch";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `ForTheSoul — ${t("tagline")}`,
      template: "%s | ForTheSoul",
    },
    description: t("tagline"),
    alternates: {
      canonical: locale === "fr" ? "/" : `/${locale}`,
      languages: { fr: "/", de: "/de", en: "/en", "x-default": "/" },
    },
    openGraph: {
      siteName: "ForTheSoul",
      type: "website",
      locale,
    },
    icons: { icon: "/favicon.ico" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  const accountHref = !profile
    ? "/connexion"
    : profile.role === "admin"
      ? "/admin"
      : profile.role === "practitioner"
        ? "/espace-praticien"
        : "/espace-participant";

  return (
    <html lang={locale} className={`${playfair.variable} ${workSans.variable}`}>
      <body className="flex min-h-screen flex-col antialiased pb-20 md:pb-0">
        <NextIntlClientProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileTabBar accountHref={accountHref} />
          <PageViewTracker />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
