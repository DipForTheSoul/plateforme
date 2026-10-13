import 'server-only';
import {createAdminClient} from '@/lib/supabase/admin';

/** Only these two commercial display values leave the privileged server client. */
export async function getFeaturedSettings() {
  const {data,error}=await createAdminClient().from('settings').select('key,value').in('key',['featured_price_chf','featured_default_days']);
  if(error)throw new Error('Tarif momentanément indisponible.');
  const values=Object.fromEntries((data??[]).map(row=>[row.key,row.value]));
  const price=Number(String(values.featured_price_chf??'').replace(',','.'));
  const days=Number(values.featured_default_days);
  const amount=Math.round(price*100);
  if(!Number.isFinite(price)||!Number.isSafeInteger(amount)||amount<50||amount>99999999||Math.abs(price*100-amount)>0.000001||!Number.isInteger(days)||days<1||days>36500)throw new Error('Le tarif de mise en avant doit être vérifié par l’administrateur.');
  return {price,days};
}
