import {expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),select:vi.fn(),in:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({from:mocks.from})}));
import {readPackSettings} from '@/lib/pack-settings';

it('limite la lecture privilégiée aux six paramètres publics des packs',async()=>{
  mocks.from.mockReturnValue({select:mocks.select});
  mocks.select.mockReturnValue({in:mocks.in});
  mocks.in.mockResolvedValue({data:[],error:null});
  await readPackSettings();
  expect(mocks.from).toHaveBeenCalledWith('settings');
  expect(mocks.select).toHaveBeenCalledWith('key,value');
  expect(mocks.in).toHaveBeenCalledWith('key',[
    'price_pack_1','price_pack_5','price_pack_10',
    'promo_label','promo_discount_percent','pack_default_valid_days',
  ]);
});
