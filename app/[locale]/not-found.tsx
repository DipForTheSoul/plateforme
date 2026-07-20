import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl">🕊️</p>
      <h1 className="mt-4 text-3xl text-soul-brown">404</h1>
      <p className="mt-2 text-soul-bronze">{t("noResults")}</p>
      <Link href="/" className="btn-primary mt-6">
        ForTheSoul
      </Link>
    </div>
  );
}
