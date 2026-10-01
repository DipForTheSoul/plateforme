import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { setRequestLocale } from "next-intl/server";
import { applyContactRequestFilters } from "@/lib/contact-request-filters";
import { ContactRequestResults, type ContactRequestRow } from "@/components/admin/ContactRequestResults";

export const dynamic = "force-dynamic";

type Search={practitioner?:string;from?:string;to?:string;q?:string};

export default async function ContactRequestsPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Search>}) {
  const {locale}=await params;
  setRequestLocale(locale);
  await requireRole(["admin"]);
  const db = await createClient();
  const filters = await searchParams;
  const [{data:practitioners},{data,error}] = await Promise.all([
    db.from("practitioners").select("id,name").order("name"),
    applyContactRequestFilters(db.from("practitioner_contact_requests").select("id,practitioner_id,visitor_name,visitor_email,visitor_phone,message,newsletter_consent,send_status,created_at,practitioner:practitioners(name)").order("created_at",{ascending:false}).limit(500),filters),
  ]);
  if (error) throw new Error("Contact requests unavailable");
  const rows = (data ?? []) as unknown as ContactRequestRow[];
  const query = new URLSearchParams(Object.entries(filters).filter(([,v])=>Boolean(v)) as [string,string][]).toString();

  return <div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="text-2xl text-soul-brown">Demande aux praticiens</h1>
      <a className="btn-secondary !py-2" href={`/api/admin/contact-requests-export?${query}`}>Exporter CSV</a>
    </div>
    <form className="mt-5 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <input className="field" name="q" defaultValue={filters.q} placeholder="Nom, e-mail ou message"/>
      <select className="field" name="practitioner" defaultValue={filters.practitioner}>
        <option value="">Tous les praticiens</option>
        {practitioners?.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}
      </select>
      <input className="field" name="from" type="date" defaultValue={filters.from}/>
      <input className="field" name="to" type="date" defaultValue={filters.to}/>
      <button className="btn-primary sm:col-span-2 lg:col-span-1">Filtrer</button>
    </form>
    <ContactRequestResults rows={rows} />
  </div>;
}
