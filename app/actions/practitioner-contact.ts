"use server";

import {headers} from "next/headers";
import {z} from "zod";
import {createAdminClient} from "@/lib/supabase/admin";
import {sendEmail} from "@/lib/email";
import {practitionerContactEmail} from "@/lib/email-templates";
import {hashRequestIdentity, isRateLimited} from "@/lib/rate-limit";
import type {Locale} from "@/types/database";

const schema=z.object({
  practitioner_id:z.uuid(),
  name:z.string().trim().min(2).max(120),
  email:z.email().transform(v=>v.trim().toLowerCase()),
  phone:z.string().trim().max(40).optional(),
  message:z.string().trim().min(10).max(3000),
  contact_consent:z.literal("on"),
  newsletter_consent:z.literal("on").optional(),
  website:z.literal(""),
  locale:z.enum(["fr","de","en"]),
});

export type PractitionerContactState={status:"idle"|"success"|"error";code?:"invalid"|"rateLimited"|"unavailable"|"sendFailed"};

export async function sendPractitionerContact(_previous:PractitionerContactState,formData:FormData):Promise<PractitionerContactState>{
  const parsed=schema.safeParse(Object.fromEntries(formData));
  if(!parsed.success)return {status:"error",code:"invalid"};
  const forwarded=(await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  const rawIp=forwarded || "local";
  let ipHash:string;
  try{ipHash=hashRequestIdentity(rawIp);}catch{return {status:"error",code:"unavailable"};}
  if(await isRateLimited(`practitioner-contact:${ipHash}`,5,3600))return {status:"error",code:"rateLimited"};

  const admin=createAdminClient();
  const {data:practitioner,error:practitionerError}=await admin.from("practitioners")
    .select("id,user_id,name,contact,status").eq("id",parsed.data.practitioner_id).eq("status","approved").maybeSingle();
  if(practitionerError||!practitioner)return {status:"error",code:"unavailable"};
  const contact=(practitioner.contact??{}) as {email?:string};
  let recipient=contact.email?.trim()||"";
  let preferredLang:Locale="fr";
  if(practitioner.user_id){
    const {data:profile}=await admin.from("profiles").select("email,preferred_lang").eq("id",practitioner.user_id).maybeSingle();
    recipient ||= profile?.email?.trim()||"";
    if(profile?.preferred_lang==="de"||profile?.preferred_lang==="en")preferredLang=profile.preferred_lang;
  }
  if(!z.email().safeParse(recipient).success)return {status:"error",code:"unavailable"};

  const now=new Date();
  const {data:request,error:insertError}=await admin.from("practitioner_contact_requests").insert({
    practitioner_id:practitioner.id,visitor_name:parsed.data.name,visitor_email:parsed.data.email,
    visitor_phone:parsed.data.phone||null,message:parsed.data.message,contact_consent:true,
    newsletter_consent:parsed.data.newsletter_consent==="on",locale:parsed.data.locale,
    send_status:"pending",ip_hash:ipHash,
  }).select("id").single();
  if(insertError||!request)return {status:"error",code:"unavailable"};

  const template=practitionerContactEmail({visitorName:parsed.data.name,visitorEmail:parsed.data.email,
    visitorPhone:parsed.data.phone,message:parsed.data.message,createdAt:now.toLocaleString(preferredLang==="fr"?"fr-CH":preferredLang==="de"?"de-CH":"en-CH"),lang:preferredLang});
  const sent=await sendEmail({to:recipient,replyTo:parsed.data.email,...template});
  await admin.from("practitioner_contact_requests").update({send_status:sent?"sent":"failed",send_error:sent?null:"transactional_email_failed"}).eq("id",request.id);
  return sent?{status:"success"}:{status:"error",code:"sendFailed"};
}
