"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { syncContactsToMailerLite } from "@/app/actions/contacts";
import type { ActionState } from "@/app/actions/events";

export function MailerLiteSync() {
  const t = useTranslations("admin.newsletter");
  const [processed,setProcessed]=useState(0);
  const [state, action, pending] = useActionState<ActionState & {issues?:{email:string;reason:string}[]}, FormData>(
    async () => {
      let cursor:string|undefined;let attempted=0;let synced=0;const issues:{email:string;reason:string}[]=[];setProcessed(0);
      try {
        do {
          const result=await syncContactsToMailerLite(cursor);
          attempted+=result.processed??0;synced+=result.synced??0;issues.push(...(result.issues??[]));setProcessed(attempted);
          if(result.error)return {error:`Synchronisation interrompue : ${synced} contacts confirmés sur ${attempted} examinés. ${result.error}`,issues};
          cursor=result.nextCursor;
          // At most five provider requests per three seconds from this run.
          if(cursor)await new Promise(resolve=>setTimeout(resolve,3000));
        }while(cursor);
        if(issues.length)return {success:`Traitement terminé : ${synced} contacts synchronisés sur ${attempted} examinés ; ${issues.length} à vérifier. Aucun contact local n’a été supprimé.`,issues};
        return {success:`${synced} contacts synchronisés vers MailerLite.`};
      }catch{return {error:`Connexion interrompue : ${synced} contacts confirmés sur ${attempted} examinés. Le dernier lot peut avoir été partiellement traité. Les contacts locaux sont conservés.`,issues};}
    },
    {}
  );

  return (
    <form action={action} className="mt-4 border-t border-soul-bronze/10 pt-4">
      <p className="mb-2 text-xs font-medium text-soul-brown">
        {t("syncTitle")}
      </p>
      <button type="submit" disabled={pending} className="btn-secondary">
        {pending ? `${t("syncing")} (${processed})` : `⟳ ${t("syncButton")}`}
      </button>
      {state.error && <p className="mt-2 text-xs text-red-700">{state.error}</p>}
      {state.success && <p className="mt-2 text-xs text-green-700">{state.success}</p>}
      {!!state.issues?.length && <div className="mt-3 text-sm" role="status">
        <p className="font-medium">Contacts à vérifier dans MailerLite</p>
        <ul className="mt-2 space-y-2">{state.issues.map(issue=><li key={issue.email} className="break-words"><strong>{issue.email}</strong> : {issue.reason}</li>)}</ul>
        <p className="mt-2 text-xs">Consulte le motif indiqué pour chaque contact. Une adresse désinscrite ne doit pas être réactivée sans nouvel accord.</p>
      </div>}
    </form>
  );
}
