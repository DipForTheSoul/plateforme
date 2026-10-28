import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

// Synthetic fixtures, exclusively in the isolated local Supabase used by qa.mjs.
export async function verifyAudienceLocal(config,password) {
  assert.equal(new URL(config.API_URL).origin,'http://127.0.0.1:54321');
  const db=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
  const count=async table=>{const r=await db.from(table).select('*',{head:true,count:'exact'});if(r.error)throw r.error;return r.count;};
  const before=await Promise.all(['audience_visitors','audience_page_visitors'].map(count));
  const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Zurich'}).format(new Date());
  for(let i=1;i<=12;i++){
    const browser=`a0d1e000-0000-4000-8000-${String(i).padStart(12,'0')}`;
    for(let page=1;page<=3;page++){
      const args={p_browser_id:browser,p_path:['/','/experiences','/lieux'][page-1],p_page_token:(i.toString(16)+page).padStart(64,'0'),p_day:day,p_event_id:`a0d1e001-0000-4000-8000-${String(i*10+page).padStart(12,'0')}`,p_channel:i<=5?'paid_social':i<=8?'google':i<=10?'social':'direct',p_country:i<=10?'CH':'FR',p_device:i%3===0?'desktop':'mobile'};
      const r=await db.rpc('record_audience_visit',args);if(r.error)throw r.error;
      const retry=await db.rpc('record_audience_visit',args);if(retry.error)throw retry.error;
    }
    if(i<=3){const r=await db.rpc('record_audience_signup',{p_browser_id:browser});if(r.error)throw r.error;}
  }
  assert.deepEqual(await Promise.all(['audience_visitors','audience_page_visitors'].map(count)),before,'Legacy counts must remain intact');
  const admin=createClient(config.API_URL,config.ANON_KEY,{auth:{persistSession:false}});
  const login=await admin.auth.signInWithPassword({email:'admin@forthesoul.test',password});if(login.error)throw login.error;
  for(const days of [7,30,90]){
    const {data,error}=await admin.rpc('get_admin_audience_followup',{p_days:days});if(error)throw error;
    assert.equal(data.daily.length,days);assert.ok(data.paid>=5);assert.ok(data.google>=3);assert.ok(data.page_views>=36);assert.ok(data.signups>=3);
    assert.equal(data.sources.reduce((sum,s)=>sum+s.count,0),data.visitors);
    assert.equal(data.conversion_rate,Math.round(data.signups/data.measured_visitors*1000)/10);
    console.log(JSON.stringify({localOnly:true,days,visitors:data.visitors,pageViews:data.page_views,signups:data.signups,conversion:data.conversion_rate,paid:data.paid,google:data.google}));
  }
  await admin.auth.signOut();
  console.log('PASS: local fixtures, deduplication, 7/30/90 days, conversion and untouched legacy counts.');
}
