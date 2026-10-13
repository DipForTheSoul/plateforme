import {NextResponse,type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
import {getStripe,isStripeConfigured} from "@/lib/stripe";
import {getFeaturedSettings} from '@/lib/featured-settings';

const SITE_URL=process.env.NEXT_PUBLIC_SITE_URL??"http://localhost:3000";
const UUID=/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

export async function POST(request:NextRequest){
  if(!isStripeConfigured())return NextResponse.json({error:"Le paiement en ligne est momentanément indisponible."},{status:503});
  const db=await createClient();const {data:{user}}=await db.auth.getUser();
  if(!user)return NextResponse.json({error:"Connexion requise."},{status:401});
  const {data:practitioner}=await db.from("practitioners").select("id,name").eq("user_id",user.id).eq("status","approved").maybeSingle();
  if(!practitioner)return NextResponse.json({error:"Compte praticien non validé."},{status:403});
  let eventId="";try{eventId=String((await request.json())?.eventId??"");}catch{return NextResponse.json({error:"Requête invalide."},{status:400});}
  if(!UUID.test(eventId))return NextResponse.json({error:"Expérience invalide."},{status:400});
  const [{data:event,error:eventError},{data:profile}]=await Promise.all([
    db.from("events").select("id,title").eq("id",eventId).eq("practitioner_id",practitioner.id).eq("status","approved").is("parent_event_id",null).maybeSingle(),
    db.from("profiles").select("preferred_lang").eq("id",user.id).maybeSingle(),
  ]);
  if(eventError||!event)return NextResponse.json({error:"Seule une offre publiée vous appartenant peut être mise en avant."},{status:403});
  let tariff;
  try{tariff=await getFeaturedSettings();}catch{return NextResponse.json({error:"Tarif momentanément indisponible. Veuillez contacter l’administrateur."},{status:503});}
  const {price,days}=tariff;const amount=Math.round(price*100);
  const locale=(profile?.preferred_lang==="de"?"de":profile?.preferred_lang==="en"?"en":"fr") as "fr"|"de"|"en";const prefix=locale==="fr"?"":`/${locale}`;
  try{
    const session=await getStripe().checkout.sessions.create({locale,mode:"payment",line_items:[{price_data:{currency:"chf",unit_amount:amount,product_data:{name:"ForTheSoul — Mise en avant",description:`${event.title} · ${days} jours`}},quantity:1}],managed_payments:{enabled:false},metadata:{kind:"featured_event",event_id:event.id,practitioner_id:practitioner.id,duration_days:String(days),amount_chf:String(price)},customer_email:user.email,success_url:`${SITE_URL}${prefix}/espace-praticien/evenements?mise_en_avant=succes`,cancel_url:`${SITE_URL}${prefix}/espace-praticien/evenements?mise_en_avant=annule`});
    if(!session.url)throw new Error("missing URL");return NextResponse.json({url:session.url});
  }catch{return NextResponse.json({error:"Impossible d’ouvrir le paiement. Réessayez dans quelques instants."},{status:502});}
}
