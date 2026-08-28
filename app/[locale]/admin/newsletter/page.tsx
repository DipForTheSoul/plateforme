import { createClient } from "@/lib/supabase/server";
import { deleteContact, updateContactInterests } from "@/app/actions/contacts";
import { getCategories } from "@/lib/queries";
import { getTranslations } from "next-intl/server";
import type { Contact } from "@/types/database";
import { ImportForm } from "./ImportForm";
import { MailerLiteSync } from "./MailerLiteSync";

export const dynamic = "force-dynamic";

export default async function AdminNewsletterPage() {
  const supabase = await createClient();
  const t = await getTranslations("admin.newsletter");

  const [{ data }, categories, { count: newCount }] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: false }).limit(500),
    getCategories(),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("consent", true)
      .is("exported_at", null),
  ]);
  const contacts = (data as Contact[]) ?? [];

  const allTags = new Set<string>(categories.map((c) => c.slug));
  contacts.forEach((c) => c.interests.forEach((tag) => allTags.add(tag)));

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6">
        <h2 className="mb-1 font-serif text-lg text-soul-brown">{t("exportTitle")}</h2>
        <p className="mb-4 text-sm text-soul-bronze">
          {t("exportHint")}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/admin/newsletter-export?scope=new" className="btn-primary">
            ⬇ {t("exportNew", { count: newCount ?? 0 })}
          </a>
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/admin/newsletter-export" className="btn-secondary">
            {t("exportAll", { count: contacts.length })}
          </a>
        </div>
        <p className="mt-3 text-xs text-soul-bronze"
          dangerouslySetInnerHTML={{ __html: t.raw("exportNewExplain") }}
        />

        {allTags.size > 0 && (
          <div className="mt-4 border-t border-soul-bronze/10 pt-4">
            <p className="mb-2 text-xs font-medium text-soul-brown">
              {t("exportSegment")}
            </p>
            <div className="flex flex-wrap gap-2">
              {[...allTags].sort().map((tag) => (
                <a key={tag} href={`/api/admin/newsletter-export?interest=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-soul-bronze/30 bg-white px-3 py-1.5 text-xs text-soul-brown hover:bg-soul-sand/50">
                  {tag}
                </a>
              ))}
            </div>
          </div>
        )}

        <MailerLiteSync />
      </section>

      <ImportForm />

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">{t("contactsTitle", { count: contacts.length })}</h2>
        <div className="card divide-y divide-soul-bronze/10">
          {contacts.length === 0 && (
            <p className="p-4 text-sm text-soul-bronze">{t("emptyContacts")}</p>
          )}
          {contacts.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-soul-brown">
                  {c.email}
                  {(c.first_name || c.last_name) && (
                    <span className="ml-2 text-xs text-soul-bronze">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ")}
                    </span>
                  )}
                </p>
                <p className="text-xs text-soul-bronze">
                  {c.source ?? "site"} · {c.interests.join(", ") || t("noTag")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={updateContactInterests} className="flex items-center gap-2">
                  <input type="hidden" name="contact_id" value={c.id} />
                  <input name="interests" defaultValue={c.interests.join(", ")}
                    placeholder={t("tagsPlaceholder")}
                    className="field !w-52 !py-1.5 text-xs" />
                  <button type="submit" className="text-xs text-soul-brown underline">{t("ok")}</button>
                </form>
                <form action={deleteContact}>
                  <input type="hidden" name="contact_id" value={c.id} />
                  <button type="submit" className="text-xs text-red-700 underline">{t("delete")}</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
