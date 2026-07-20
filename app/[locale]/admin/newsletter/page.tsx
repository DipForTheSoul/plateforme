import { createClient } from "@/lib/supabase/server";
import { deleteContact, updateContactInterests } from "@/app/actions/contacts";
import { getCategories } from "@/lib/queries";
import type { Contact } from "@/types/database";
import { ImportForm } from "./ImportForm";

export const dynamic = "force-dynamic";

/** Base newsletter : import Wix, tags par intérêt, export CSV segmenté (MailerLite). */
export default async function AdminNewsletterPage() {
  const supabase = await createClient();
  const [{ data }, categories] = await Promise.all([
    supabase.from("contacts").select("*").order("created_at", { ascending: false }).limit(500),
    getCategories(),
  ]);
  const contacts = (data as Contact[]) ?? [];

  // Tags existants (catégories + tags libres présents dans la base).
  const allTags = new Set<string>(categories.map((c) => c.slug));
  contacts.forEach((c) => c.interests.forEach((t) => allTags.add(t)));

  return (
    <div className="flex flex-col gap-8">
      <section className="card p-6">
        <h2 className="mb-1 font-serif text-lg text-soul-brown">Export CSV (MailerLite)</h2>
        <p className="mb-4 text-sm text-soul-bronze">
          Export segmenté par tag d&apos;intérêt, prêt à importer dans MailerLite.
        </p>
        <div className="flex flex-wrap gap-2">
          {/* Liens <a> natifs volontaires : téléchargement CSV (Content-Disposition),
              le routeur client Next ne doit pas intercepter la navigation. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/admin/newsletter-export" className="btn-primary">
            Tout exporter ({contacts.length})
          </a>
          {[...allTags].sort().map((tag) => (
            <a key={tag} href={`/api/admin/newsletter-export?interest=${encodeURIComponent(tag)}`}
              className="btn-secondary">
              {tag}
            </a>
          ))}
        </div>
      </section>

      <ImportForm />

      <section>
        <h2 className="mb-4 text-xl text-soul-brown">Contacts ({contacts.length})</h2>
        <div className="card divide-y divide-soul-bronze/10">
          {contacts.length === 0 && (
            <p className="p-4 text-sm text-soul-bronze">Base vide — importez vos contacts Wix.</p>
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
                  {c.source ?? "site"} · {c.interests.join(", ") || "aucun tag"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <form action={updateContactInterests} className="flex items-center gap-2">
                  <input type="hidden" name="contact_id" value={c.id} />
                  <input name="interests" defaultValue={c.interests.join(", ")}
                    placeholder="tags, séparés, par, virgules"
                    className="field !w-52 !py-1.5 text-xs" />
                  <button type="submit" className="text-xs text-soul-brown underline">OK</button>
                </form>
                <form action={deleteContact}>
                  <input type="hidden" name="contact_id" value={c.id} />
                  <button type="submit" className="text-xs text-red-700 underline">Suppr.</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
