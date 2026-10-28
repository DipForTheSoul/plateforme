import type {Metadata} from 'next';
import {AdminAudienceFollowup} from '../AudienceFollowup';
import {audiencePeriod} from '@/lib/audience-acquisition';
export const metadata:Metadata={title:'Suivi des visiteurs',robots:{index:false,follow:false}};
export default async function AudienceTracking({searchParams}:{searchParams:Promise<{jours?:string}>}) {
 const query=await searchParams;return <AdminAudienceFollowup days={audiencePeriod(query.jours)}/>;
}
