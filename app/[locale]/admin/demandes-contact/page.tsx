import {setRequestLocale} from "next-intl/server";
import {Link} from "@/i18n/navigation";
import {requireRole} from "@/lib/auth";
import {createClient} from "@/lib/supabase/server";
import {applyContactRequestFilters} from "@/lib/contact-request-filters";
import {formatDate} from "@/lib/utils";

export const dynamic="force-dynamic";
type Search={practitioner?:string;from?:string;to?:string;q?:string};
interface ContactRow {id:string;created_at:string;visitor_name:string;visitor_email:string;visitor_phone:string|null;message:string;newsletter_consent:boolean;send_status:string;practitioner:{name:string}|null}
export default async function ContactRequestsPage({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Search>}){
  const {locale}=await params;setRequestLocale(locale);await requireRole(["admin"]);const filters=await searchParams;const db=await createClient();
  const [{data:practitioners},{data,error}]=await Promise.all([
    db.from("practitioners").select("id,name").order("name"),
    applyContactRequestFilters(db.from("practitioner_contact_requests").select("id,practitioner_id,visitor_name,visitor_email,visitor_phone,message,newsletter_consent,send_status,created_at,practitioner:practitioners(name)").order("created_at",{ascending:false}).limit(500),filters),
  ]);
  if(error)throw new Error("Contact requests unavailable");
  const rows=(data??[]) as unknown as ContactRow[];
  const query=new URLSearchParams(Object.entries(filters).filter(([,v])=>Boolean(v)) as [string,string][]).toString();
  return <div><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl text-soul-brown">Demandes de contact</h1><a className="btn-secondary !py-2" href={`/api/admin/contact-requests-export?${query}`}>Exporter CSV</a></div>
    <form className="mt-5 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"><input className="field" name="q" defaultValue={filters.q} placeholder="Nom, e-mail ou message"/><select className="field" name="practitioner" defaultValue={filters.practitioner}><option value="">Tous les praticiens</option>{practitioners?.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><input className="field" name="from" type="date" defaultValue={filters.from}/><input className="field" name="to" type="date" defaultValue={filters.to}/><button className="btn-primary sm:col-span-2 lg:col-span-1">Filtrer</button></form>
    <div className="mt-5 overflow-x-auto rounded-2xl bg-white"><table className="min-w-full text-left text-sm"><thead><tr className="border-b"><th className="p-3">Date</th><th className="p-3">Praticien</th><th className="p-3">Contact</th><th className="p-3">Téléphone</th><th className="p-3">Message</th><th className="p-3">Newsletter</th><th className="p-3">Statut</th></tr></thead><tbody>{rows.map(r=><tr key={r.id} className="border-b align-top"><td className="p-3 whitespace-nowrap">{formatDate(r.created_at,"fr")}</td><td className="p-3">{r.practitioner?.name}</td><td className="p-3"><Link className="underline" href={`/admin/demandes-contact/${r.id}`}>{r.visitor_name}</Link><br/><a className="text-xs underline" href={`mailto:${r.visitor_email}`}>{r.visitor_email}</a></td><td className="p-3">{r.visitor_phone||"—"}</td><td className="p-3 max-w-72 truncate">{r.message}</td><td className="p-3">{r.newsletter_consent?"Oui":"Non"}</td><td className="p-3">{r.send_status}</td></tr>)}</tbody></table>{!rows.length&&<p className="p-6">Aucune demande.</p>}</div>
  </div>;
}
