import {expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {AdminPageViews} from '@/app/[locale]/admin/PageViews';
vi.mock('next-intl/server',()=>({getTranslations:async()=>(key:string)=>key}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({rpc:()=>({abortSignal:async()=>({data:[{total:39992,pages:[{path:'/experiences',views:123}]}],error:null})})})}));
it('conserve le classement sans réafficher le total historique global',async()=>{
  const html=renderToStaticMarkup(await AdminPageViews());
  expect(html).toContain('/experiences');expect(html).toContain('123');expect(html).not.toContain('39992');expect(html).not.toContain('dashboard.pageViews');
});
