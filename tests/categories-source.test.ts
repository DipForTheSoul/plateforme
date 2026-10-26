import {afterEach, expect, it, vi} from 'vitest';
const state = vi.hoisted(() => ({rows: [] as {id:string;slug:string;name:string;position:number}[]}));
vi.mock('@/lib/supabase/public', () => ({createPublicClient: () => ({from: () => ({select: () => ({order: async () => ({data:state.rows,error:null})})})})}));
import {getCategories} from '@/lib/queries';
afterEach(() => vi.unstubAllEnvs());
it.each(['production','preview'])('utilise les huit identités réelles de la base en %s', async environment => {
  vi.stubEnv('VERCEL_ENV', environment);
  vi.stubEnv('VERCEL_GIT_COMMIT_REF', 'apercu-univers-lieux');
  state.rows=Array.from({length:8},(_,i)=>({id:`db-${i}`,slug:`universe-${i}`,name:`Univers ${i}`,position:i+1}));
  expect(await getCategories()).toEqual(state.rows);
});
it('ne masque pas une base incomplète par des catégories fictives en preview', async () => {
  vi.stubEnv('VERCEL_ENV','preview');
  vi.stubEnv('VERCEL_GIT_COMMIT_REF','apercu-univers-lieux');
  state.rows=[];
  expect(await getCategories()).toEqual([]);
});
