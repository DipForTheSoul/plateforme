import 'server-only';
import {createAdminClient} from '@/lib/supabase/admin';

/** Only visitor-facing pack prices; never return arbitrary administration settings. */
export function readPackSettings() {
  return createAdminClient().from('settings').select('key,value').in('key',[
    'price_pack_1','price_pack_5','price_pack_10',
    'promo_label','promo_discount_percent','pack_default_valid_days',
  ]);
}
