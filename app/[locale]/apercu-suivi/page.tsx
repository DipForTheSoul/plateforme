import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {AdminAudienceFollowup} from '../admin/AudienceFollowup';
import {audiencePeriod} from '@/lib/audience-acquisition';
export const metadata:Metadata={title:'Proposition de suivi',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default async function AudiencePreview({searchParams}:{searchParams:Promise<{jours?:string}>}) {
 if(process.env.VERCEL_ENV!=='preview'&&process.env.QA_LOCAL!=='1')notFound();
 const query=await searchParams;
 return <main className="mx-auto max-w-6xl px-4 py-8"><AdminAudienceFollowup days={audiencePeriod(query.jours)} preview/></main>;
}
