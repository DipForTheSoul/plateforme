"use client";

import {useActionState} from "react";
import {useTranslations} from "next-intl";
import {Link} from "@/i18n/navigation";
import {sendPractitionerContact,type PractitionerContactState} from "@/app/actions/practitioner-contact";

const initialState:PractitionerContactState={status:"idle"};

export function PractitionerContactForm({practitionerId,locale}:{practitionerId:string;locale:string}){
  const t=useTranslations("practitionerContact");
  const [state,action,pending]=useActionState(sendPractitionerContact,initialState);
  if(state.status==="success")return <div role="status" className="rounded-2xl border border-green-200 bg-green-50 p-5 text-green-900">{t("success")}</div>;
  const error=state.code?t(`errors.${state.code}`):null;
  return <form action={action} className="mt-6 space-y-4 rounded-3xl border border-soul-bronze/15 bg-white p-5 sm:p-6">
    <input type="hidden" name="practitioner_id" value={practitionerId}/><input type="hidden" name="locale" value={locale}/>
    <div className="absolute -left-[9999px]" aria-hidden="true"><label>{t("honeypot")}<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
    <h2 className="font-serif text-2xl text-soul-brown">{t("title")}</h2>
    <p className="text-sm text-soul-bronze">{t("intro")}</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="label">{t("name")}<input className="field mt-1" name="name" required minLength={2} maxLength={120} autoComplete="name"/></label>
      <label className="label">{t("email")}<input className="field mt-1" name="email" type="email" required maxLength={320} autoComplete="email"/></label>
    </div>
    <label className="label">{t("phone")}<input className="field mt-1" name="phone" type="tel" maxLength={40} autoComplete="tel"/></label>
    <label className="label">{t("message")}<textarea className="field mt-1 min-h-36" name="message" required minLength={10} maxLength={3000}/></label>
    <label className="flex items-start gap-3 text-sm text-soul-ink/80"><input className="mt-1" type="checkbox" name="contact_consent" required/><span>{t("contactConsent")}</span></label>
    <label className="flex items-start gap-3 text-sm text-soul-ink/80"><input className="mt-1" type="checkbox" name="newsletter_consent"/><span>{t("newsletterConsent")}</span></label>
    <p className="text-xs text-soul-bronze">{t.rich("legal",{privacy:chunks=><Link className="underline" href="/confidentialite">{chunks}</Link>,terms:chunks=><Link className="underline" href="/cgu">{chunks}</Link>})}</p>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <button disabled={pending} className="btn-primary" type="submit">{pending?t("sending"):t("submit")}</button>
  </form>;
}
