// Connected regression checks, restricted to the disposable local QA database.
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {homedir} from 'node:os';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';
import {chromium} from '@playwright/test';

const result=spawnSync('supabase',['status','-o','json'],{encoding:'utf8',env:{...process.env,DOCKER_HOST:`unix://${homedir()}/.colima/forthesoul-qa/docker.sock`}});
assert.equal(result.status,0,'Isolated QA must be running');
const config=JSON.parse(result.stdout);
assert.equal(config.API_URL,'http://127.0.0.1:54321');
const base='http://localhost:3100';
const service=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const ok=r=>{if(r.error)throw new Error(r.error.message);return r.data;};
const browser=await chromium.launch();
let eventId;
const settings=ok(await service.from('settings').select('key,value').in('key',['featured_price_chf','featured_default_days']));
async function login(email){
  const jar=new Map();
  const client=createServerClient(config.API_URL,config.ANON_KEY,{cookies:{getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:entries=>entries.forEach(c=>jar.set(c.name,c.value))}});
  const auth=ok(await client.auth.signInWithPassword({email,password:'Fts-QA-Local-2026!'}));
  const context=await browser.newContext({viewport:{width:375,height:812},hasTouch:true});
  await context.addCookies([...jar].map(([name,value])=>({name,value,url:base,sameSite:'Lax'})));
  return {context,page:await context.newPage(),userId:auth.user.id};
}
try{
  const owner=await login('praticien@forthesoul.test');
  const practitioner=ok(await service.from('practitioners').select('id').eq('user_id',owner.userId).single());
  const description='Premier paragraphe de contrôle.\n\nDeuxième paragraphe de contrôle.';
  const event=ok(await service.from('events').insert({practitioner_id:practitioner.id,title:'Contrôle temporaire octobre',slug:`qa-followup-${crypto.randomUUID()}`,category_id:'c0000000-0000-4000-8000-000000000003',status:'approved',start_date:'2030-10-30T10:00:00Z',duration_minutes:90,languages:['fr'],price:0,description}).select('id,slug').single());
  eventId=event.id;
  const admin=await login('admin@forthesoul.test');
  await admin.page.goto(base+'/admin/mises-en-avant');
  const price=admin.page.locator('#featured_price_chf');
  await price.fill('27.50');
  await price.locator('xpath=ancestor::form').getByRole('button').click();
  await admin.page.getByText('Paramètres enregistrés.',{exact:true}).waitFor({timeout:10000});
  assert.equal(ok(await service.from('settings').select('value').eq('key','featured_price_chf').single()).value,'27.5');
  console.log('PASS tarif avec centimes réellement enregistré par le formulaire admin');
  await owner.page.goto(base+'/espace-praticien/evenements');
  const card=owner.page.locator('.card').filter({hasText:'Contrôle temporaire octobre'});
  await card.getByRole('button',{name:'Mettre en avant',exact:true}).tap();
  await card.getByRole('button',{name:'Payer avec Stripe'}).waitFor();
  assert.match(await card.innerText(),/27,50/);
  assert.ok(await owner.page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  console.log('PASS compte praticien réel local : panneau ouvert et tarif admin repris');
  await owner.page.screenshot({path:'output/qa-featured-connected.png',fullPage:true});
  for(let i=0;i<2;i++){
    await admin.page.goto(base+`/admin/soumissions/${eventId}`);
    const editor=admin.page.locator('[contenteditable="true"]');
    await editor.waitFor();
    if(i===0)await editor.fill(description+'\n\nTexte modifié et sauvegardé.');
    await admin.page.locator('form').filter({has:editor}).locator('button[type="submit"]').last().click();
    await admin.page.getByText('Expérience mise à jour.',{exact:true}).waitFor({timeout:10000});
    const stored=ok(await service.from('events').select('description,status').eq('id',eventId).single());
    assert.equal(stored.description,description+'\n\nTexte modifié et sauvegardé.');
    assert.equal(stored.status,'approved');
  }
  const publicPage=await browser.newPage();
  await publicPage.goto(base+`/experiences/${event.slug}`);
  await publicPage.getByText('Texte modifié et sauvegardé.',{exact:true}).waitFor();
  console.log('PASS deux enregistrements admin sans croissance des espaces et texte public actualisé');
}finally{
  // Only restore local settings and remove the one synthetic event created above.
  for(const setting of settings)ok(await service.from('settings').update({value:setting.value}).eq('key',setting.key));
  if(!settings.some(s=>s.key==='featured_price_chf'))ok(await service.from('settings').delete().eq('key','featured_price_chf'));
  if(eventId)ok(await service.from('events').delete().eq('id',eventId));
  await browser.close();
  console.log('QA local terminé : paramètres restaurés, offre temporaire retirée.');
}
