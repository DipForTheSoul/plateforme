// Local connected QA only. Credentials stay in child-process memory, never Git.
import {spawnSync,spawn} from 'node:child_process';
import {homedir} from 'node:os';
import {createClient} from '@supabase/supabase-js';
const env={...process.env,DOCKER_HOST:`unix://${homedir()}/.colima/forthesoul-qa/docker.sock`,SUPABASE_TELEMETRY_DISABLED:'1'};
const status=spawnSync('supabase',['status','-o','json'],{env,encoding:'utf8'});
if(status.status!==0)throw new Error('Start the local forthesoul-qa Supabase first.');
const config=JSON.parse(status.stdout);
if(new URL(config.API_URL).origin!=='http://127.0.0.1:54321')throw new Error('QA is restricted to the isolated local API on port 54321.');
const client=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
export const qaPassword='Fts-QA-Local-2026!'; // Disposable local fixtures; never valid on remote infrastructure.
const command=process.argv[2]??'serve';
if(command==='verify'){
  const {verifyLocal}=await import('./qa-verify.mjs');await verifyLocal(config,qaPassword);
}else if(command==='auth'){
  const {verifyAuthLocal}=await import('./qa-auth.mjs');await verifyAuthLocal(config,qaPassword);
}else if(command==='web'){
  const {verifyWebLocal}=await import('./qa-web.mjs');await verifyWebLocal(config,qaPassword);
}else if(command==='seed'){
  const {data:listing,error:listError}=await client.auth.admin.listUsers();if(listError)throw listError;
  for(const [email,role,name,status] of [
    ['admin@forthesoul.test','admin','Administration QA','approved'],
    ['praticien@forthesoul.test','practitioner','Praticien QA','approved'],
    ['autre@forthesoul.test','practitioner','Autre praticien QA','approved'],
    ['nouveau@forthesoul.test','practitioner','Nouveau praticien QA','pending'],
    ['visiteur@forthesoul.test','participant','Visiteur QA','approved'],
  ]){
    let user=listing.users.find(u=>u.email===email);
    const wasCreated=!user;
    if(!user){const result=await client.auth.admin.createUser({email,password:qaPassword,email_confirm:true,user_metadata:{role:role==='admin'?'participant':role,preferred_lang:'fr'}});if(result.error)throw result.error;user=result.data.user;}
    const profile=await client.from('profiles').update({role,preferred_lang:'fr'}).eq('id',user.id);if(profile.error)throw profile.error;
    if(role==='practitioner'){
      const found=await client.from('practitioners').select('id').eq('user_id',user.id).maybeSingle();if(found.error)throw found.error;
      if(!found.data||wasCreated){
        const payload={user_id:user.id,name,slug:email.split('@')[0]+'-qa',status,bio:'Profil fictif pour les tests de bout en bout.',languages:['fr'],contact:{email}};
        const inserted=found.data?await client.from('practitioners').update(payload).eq('id',found.data.id).select('id').single():await client.from('practitioners').insert(payload).select('id').single();if(inserted.error)throw inserted.error;
        const credited=await client.rpc('add_credits',{p_practitioner_id:inserted.data.id,p_amount:20,p_stripe_session_id:'local-qa-initial-'+user.id});if(credited.error)throw credited.error;
      }
    }
    console.log(`QA account ready: ${email} (${role})`);
  }
}else if(command==='serve'||command==='build'||command==='start'){
  const localEnv={...env,NEXT_PUBLIC_SUPABASE_URL:config.API_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY:config.ANON_KEY,SUPABASE_SERVICE_ROLE_KEY:config.SERVICE_ROLE_KEY,NEXT_PUBLIC_SITE_URL:'http://localhost:3100',LOCAL_MAILPIT_URL:'http://127.0.0.1:54324',CONTACT_NOTIFY_EMAIL:'admin@forthesoul.test',RESEND_API_KEY:'',MAILERLITE_API_KEY:'',STRIPE_SECRET_KEY:'',STRIPE_WEBHOOK_SECRET:'',QA_LOCAL:'1',NEXT_PUBLIC_GA_ID:'',NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:''};
  const args=command==='build'?['run','build']:['run',command==='start'?'start':'dev','--','--port','3100','--hostname','localhost'];
  const child=spawn('npm',args,{env:localEnv,stdio:'inherit'});
  process.on('SIGINT',()=>child.kill('SIGINT'));process.on('SIGTERM',()=>child.kill('SIGTERM'));child.on('exit',code=>process.exit(code??1));
}else throw new Error('Usage: node scripts/qa.mjs seed|verify|auth|web|serve|build|start');
