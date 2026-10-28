import {afterEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import type {AnchorHTMLAttributes} from 'react';
vi.mock('next-intl/server',()=>({getLocale:async()=> 'fr',getTranslations:async()=> (key:string)=>key}));
vi.mock('next/navigation',()=>({notFound:()=>{throw new Error('NOT_FOUND');}}));
vi.mock('@/i18n/navigation',()=>({Link:(props:AnchorHTMLAttributes<HTMLAnchorElement>)=><a {...props}/> }));
vi.mock('@/lib/supabase/server',()=>({createClient:()=>{throw new Error('Preview must not read private data');}}));
vi.mock('@/app/[locale]/admin/AudienceFollowup',()=>({AdminAudienceFollowup:({compact,preview}:{compact:boolean;preview:boolean})=><div data-compact={String(compact)} data-preview={String(preview)}/> }));
import Preview from '@/app/[locale]/apercu-suivi/page';
afterEach(()=>vi.unstubAllEnvs());
it('shows the admin home by default with sample cards and links confined to the preview',async()=>{
 vi.stubEnv('VERCEL_ENV','preview');
 const html=renderToStaticMarkup(await Preview({searchParams:Promise.resolve({})}));
 expect(html).toContain('dashboard.pendingSubmissions');
 expect(html).toContain('Données d’exemple');
 expect(html).toContain('data-compact="true"');
 expect(html).toContain('/apercu-suivi?vue=suivi');
 expect(html).not.toContain('href="/admin');
});
it.each([{vue:'suivi',jours:'7'},{jours:'90'}])('keeps detailed view and legacy period links usable (%j)',async query=>{
 vi.stubEnv('VERCEL_ENV','preview');
 const html=renderToStaticMarkup(await Preview({searchParams:Promise.resolve(query)}));
 expect(html).toContain('data-compact="false"');
 expect(html).not.toContain('dashboard.pendingSubmissions');
 expect(html).toContain('/apercu-suivi?vue=accueil');
});
it('does not expose the demo in production',async()=>{
 vi.stubEnv('VERCEL_ENV','production');vi.stubEnv('QA_LOCAL','');
 await expect(Preview({searchParams:Promise.resolve({})})).rejects.toThrow('NOT_FOUND');
});
