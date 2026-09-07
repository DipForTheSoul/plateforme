"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { syncContactsToMailerLite } from "@/app/actions/contacts";
import type { ActionState } from "@/app/actions/events";

export function MailerLiteSync() {
  const t = useTranslations("admin.newsletter");
  const [processed,setProcessed]=useState(0);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async () => {
      let cursor:string|undefined;let total=0;setProcessed(0);
      try {
        do {
          const result=await syncContactsToMailerLite(cursor);
          total+=result.processed??0;setProcessed(total);
          if(result.error)return {error:result.error};
          cursor=result.nextCursor;
          // At most five provider requests per three seconds from this run.
          if(cursor)await new Promise(resolve=>setTimeout(resolve,3000));
        }while(cursor);
        return {success:`${total} contacts synchronisés vers MailerLite.`};
      }catch{return {error:'Connexion interrompue. Relancez la synchronisation ; les contacts locaux sont conservés.'};}
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
    </form>
  );
}
