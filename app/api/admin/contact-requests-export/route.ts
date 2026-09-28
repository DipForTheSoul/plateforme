import {NextRequest,NextResponse} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {applyContactRequestFilters,contactRequestFilters} from "@/lib/contact-request-filters";
import {csvCell} from "@/lib/contact-csv";

interface ExportRow {id:string;created_at:string;practitioner_id:string;visitor_name:string;visitor_email:string;visitor_phone:string|null;message:string;contact_consent:boolean;newsletter_consent:boolean;locale:string;send_status:string;send_error:string|null;ip_hash:string;practitioner:{name:string}|null}

export async function GET(request:NextRequest){
  const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
  const {data:profile}=await db.from("profiles").select("role").eq("id",user.id).maybeSingle();if(profile?.role!=="admin")return NextResponse.json({error:"Forbidden"},{status:403});
  const filters=contactRequestFilters(request.nextUrl.searchParams);const rows:ExportRow[]=[];
  for(let from=0;;from+=500){const {data,error}=await applyContactRequestFilters(db.from("practitioner_contact_requests").select("*,practitioner:practitioners(name)").order("created_at",{ascending:false}).range(from,from+499),filters);if(error)return NextResponse.json({error:"Export unavailable"},{status:503});const batch=(data??[]) as unknown as ExportRow[];rows.push(...batch);if(batch.length<500)break;}
  const header=["id","date","praticien_id","praticien","nom","email","telephone","message","consentement_contact","consentement_newsletter","langue","statut_envoi","erreur_envoi","hash_ip"];
  const body=[header,...rows.map(r=>[r.id,r.created_at,r.practitioner_id,r.practitioner?.name??"",r.visitor_name,r.visitor_email,r.visitor_phone??"",r.message,r.contact_consent?"oui":"non",r.newsletter_consent?"oui":"non",r.locale,r.send_status,r.send_error??"",r.ip_hash])].map(row=>row.map(v=>csvCell(String(v))).join(";")).join("\r\n");
  return new NextResponse(`\uFEFF${body}`,{headers:{"content-type":"text/csv; charset=utf-8","content-disposition":`attachment; filename="demandes-contact-${new Date().toISOString().slice(0,10)}.csv"`}});
}
