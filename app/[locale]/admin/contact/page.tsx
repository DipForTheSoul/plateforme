import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { toggleContactHandled } from "@/app/actions/contact";

export const dynamic = "force-dynamic";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  locale: string | null;
  handled: boolean;
  created_at: string;
}

/** Back-office : messages reçus via le formulaire de contact public. */
export default async function AdminContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireRole(["admin"]);

  const t = await getTranslations("admin.contact");
  const supabase = await createClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, locale, handled, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const messages = (data as ContactMessage[]) ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl text-soul-brown">{t("title")}</h1>

      {messages.length === 0 ? (
        <p className="rounded-2xl bg-soul-sand/40 p-6 text-sm text-soul-brown">
          {t("empty")}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`card p-5 ${m.handled ? "opacity-60" : ""}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-soul-brown">
                    {m.name}{" "}
                    <a href={`mailto:${m.email}`} className="text-sm font-normal text-soul-terracotta underline">
                      {m.email}
                    </a>
                  </p>
                  <p className="text-xs text-soul-bronze">
                    {formatDate(m.created_at)}
                    {m.locale ? ` · ${m.locale.toUpperCase()}` : ""}
                  </p>
                </div>
                <form action={toggleContactHandled}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="handled" value={(!m.handled).toString()} />
                  <button
                    type="submit"
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      m.handled
                        ? "bg-soul-bronze/15 text-soul-bronze"
                        : "bg-soul-violet/10 text-soul-violet"
                    }`}
                  >
                    {m.handled ? t("handled") : t("markHandled")}
                  </button>
                </form>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm text-soul-ink/85">{m.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
