// Real Next HTTP + local database checks. Requires the production QA server.
import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';

export async function verifyWebLocal(config,password){
  assert.equal(new URL(config.API_URL).origin,'http://127.0.0.1:54321');
  const service=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const run=crypto.randomUUID();let userId;let practitionerId;
  const ok=result=>{if(result.error)throw new Error(`QA database error: ${result.error.code}`);return result.data;};
  const check=(name,condition)=>{assert.ok(condition,name);console.log(`PASS ${name}`);};
  const base='http://localhost:3100';
  try{
    const user=ok(await service.auth.admin.createUser({email:`web-${run}@forthesoul.test`,password,email_confirm:true,user_metadata:{role:'practitioner'}}));userId=user.user.id;
    practitionerId=ok(await service.from('practitioners').update({name:'Navigation QA temporaire',status:'approved'}).eq('user_id',userId).select('id').single()).id;
    const rows=Array.from({length:3},(_,i)=>({id:crypto.randomUUID(),title:`QA simultanée ${i}`,slug:`qa-web-${run}-${i}`,practitioner_id:practitionerId,status:'approved',start_date:'2030-10-30T10:00:00Z',duration_minutes:90,languages:['fr'],price:0,description:'Essai local temporaire de navigation.'})).sort((a,b)=>a.id.localeCompare(b.id));
    ok(await service.from('events').insert(rows));
    const response=await fetch(`${base}/experiences/${rows[1].slug}`);const html=await response.text();
    check('fiche Next réellement rendue sans erreur',response.ok&&!html.includes('NEXT_HTTP_ERROR_FALLBACK'));
    check('précédente exactement simultanée présente',html.includes(`href="/experiences/${rows[0].slug}"`));
    check('suivante exactement simultanée présente',html.includes(`href="/experiences/${rows[2].slug}"`));
    const calendar=await fetch(`${base}/api/events/${rows[1].slug}/ics`);const ics=await calendar.text();
    check('agenda de 90 minutes, conversion suisse exacte',calendar.ok&&ics.includes('20301030T100000Z')&&ics.includes('20301030T113000Z'));
    const ping=path=>fetch(`${base}/api/views`,{method:'POST',headers:{'content-type':'application/json','x-forwarded-for':`qa-local-${run}`},body:JSON.stringify({path,locale:'fr'})});
    const privatePath=`/admin/qa-${run}`;
    check('page privée ignorée par le suivi',(await ping(privatePath)).ok&&ok(await service.from('page_views').select('id').eq('path',privatePath)).length===0);
    const path=`/qa-${run}`;
    check('paramètres sensibles retirés du suivi',(await ping(`${path}?private=do-not-store`)).ok&&ok(await service.from('page_views').select('path').eq('path',path)).length===1);
    const attempts=await Promise.all(Array.from({length:5},()=>ping(path)));
    check('limite HTTP partagée appliquée par Next',attempts.filter(r=>r.status===429).length===2&&attempts.filter(r=>r.ok).length===3);
    check('refus anti-spam sans insertion excédentaire',ok(await service.from('page_views').select('id').eq('path',path)).length===4);
  }finally{
    ok(await service.from('page_views').delete().eq('path',`/qa-${run}`));
    if(practitionerId)ok(await service.from('practitioners').delete().eq('id',practitionerId));
    if(userId)ok(await service.auth.admin.deleteUser(userId));
    console.log('Expériences, vues et compte temporaires de ce test supprimés.');
  }
}
