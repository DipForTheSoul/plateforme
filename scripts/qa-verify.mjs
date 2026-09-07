import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';

export async function verifyLocal(config,password){
  assert.equal(new URL(config.API_URL).origin,'http://127.0.0.1:54321');
  const make=key=>createClient(config.API_URL,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const service=make(config.SERVICE_ROLE_KEY),owner=make(config.ANON_KEY),other=make(config.ANON_KEY),anon=make(config.ANON_KEY);
  const run=crypto.randomUUID();let userId;let practitionerId;let objectPath;
  const contactEmail=`contact-${run}@forthesoul.test`;
  const ok=result=>{if(result.error)throw result.error;return result.data;};
  const check=(name,condition)=>{assert.ok(condition,name);console.log(`PASS ${name}`);};
  try{
    const created=ok(await service.auth.admin.createUser({email:`verify-${run}@forthesoul.test`,password,email_confirm:true,user_metadata:{role:'practitioner'}}));userId=created.user.id;
    const practitioner=ok(await service.from('practitioners').update({name:'QA temporaire',slug:`qa-${run}`,status:'approved',languages:['fr']}).eq('user_id',userId).select('id').single());
    practitionerId=practitioner.id;
    ok(await service.rpc('add_credits',{p_practitioner_id:practitioner.id,p_amount:20,p_stripe_session_id:`qa-seed-${run}`}));
    ok(await owner.auth.signInWithPassword({email:created.user.email,password}));
    ok(await other.auth.signInWithPassword({email:'autre@forthesoul.test',password}));
    const balance=async()=>ok(await owner.rpc('get_credit_balance',{p_practitioner_id:practitioner.id}));
    const payload={title:'QA transactions concurrentes',description:'Expérience fictive pour vérifier les transactions réelles.',category_ids:['c0000000-0000-4000-8000-000000000003'],venue_id:'b0000000-0000-4000-8000-000000000001',start_date:'2026-10-09T09:00:00.000Z',end_date:null,duration_minutes:90,price:12.5,languages:['fr'],recurrence:'custom',recurrence_count:2,images:[],occurrences:[{start_date:'2026-10-30T10:00:00.000Z',end_date:null}]};
    const request={p_input:payload,p_practitioner_id:practitioner.id,p_event_id:null,p_submission_id:crypto.randomUUID(),p_expected_updated_at:null};
    ok(await service.from('practitioners').update({status:'pending'}).eq('id',practitionerId));
    check('praticien non approuvé : publication refusée',Boolean((await owner.rpc('save_event_transaction',request)).error)&&await balance()===20);
    ok(await service.from('practitioners').update({status:'approved'}).eq('id',practitionerId));
    const pair=await Promise.all([owner.rpc('save_event_transaction',request),owner.rpc('save_event_transaction',request)]);
    const first=ok(pair[0]);check('double dépôt concurrent : même événement, un seul débit',ok(pair[1]).id===first.id&&await balance()===19);
    const dates=ok(await owner.from('events').select('id,start_date').or(`id.eq.${first.id},parent_event_id.eq.${first.id}`));check('deux dates réellement stockées',dates.length===2);
    check('brouillon invisible aux anonymes',ok(await anon.from('events').select('id').eq('id',first.id)).length===0);
    check('brouillon invisible à un autre praticien',ok(await other.from('events').select('id').eq('id',first.id)).length===0);
    check('édition d’un autre propriétaire refusée',Boolean((await other.rpc('save_event_transaction',{...request,p_event_id:first.id})).error));
    check('solde d’un autre propriétaire refusé',Boolean((await other.rpc('get_credit_balance',{p_practitioner_id:practitioner.id})).error));
    check('ancien débit isolé inaccessible',Boolean((await owner.rpc('consume_credit',{p_description:'forged'})).error));
    const failed=await owner.rpc('save_event_transaction',{...request,p_submission_id:crypto.randomUUID(),p_input:{...payload,category_ids:[crypto.randomUUID()]}});
    check('échec de catégorie : aucun crédit perdu',Boolean(failed.error)&&await balance()===19);
    const stripe={p_practitioner_id:practitioner.id,p_amount:5,p_stripe_session_id:`qa-payment-${run}`};
    ok(await service.rpc('add_credits',stripe));ok(await service.rpc('add_credits',stripe));check('rejeu d’attribution : un seul pack de cinq',await balance()===24);
    check('auto-promotion admin refusée',Boolean((await owner.from('profiles').update({role:'admin'}).eq('id',userId)).error));
    objectPath=`${userId}/qa-${run}.png`;const picture=await readFile(new URL('../public/logo.png',import.meta.url));
    ok(await owner.storage.from('images').upload(objectPath,picture,{contentType:'image/png'}));
    check('image publique téléversée lisible',(await fetch(`${config.API_URL}/storage/v1/object/public/images/${objectPath}`)).ok);
    check('remplacement de l’image par un autre compte refusé',Boolean((await other.storage.from('images').upload(objectPath,picture,{contentType:'image/png',upsert:true})).error));
    await other.storage.from('images').remove([objectPath]);check('suppression par un autre compte sans effet',(await fetch(`${config.API_URL}/storage/v1/object/public/images/${objectPath}`)).ok);
    check('format actif SVG refusé par le bucket',Boolean((await owner.storage.from('images').upload(`${userId}/qa-${run}.svg`,new Blob(['<svg/>'],{type:'image/svg+xml'}))).error));
    const nearby=ok(await anon.rpc('venues_within_radius',{center_lat:46.5167,center_lng:6.629,radius_km:5}));check('recherche géographique PostGIS réelle',nearby.some(v=>v.venue_id===payload.venue_id));
    check('écriture newsletter directe interdite : impossible de contourner les limites',Boolean((await anon.from('contacts').insert({email:contactEmail,consent:true})).error));
    ok(await service.from('contacts').insert({email:contactEmail,consent:true,source:'qa',opt_in_at:new Date().toISOString()}));
    check('inscription par le serveur validé enregistrée',ok(await service.from('contacts').select('consent').eq('email',contactEmail).single()).consent===true);
    check('contacts privés invisibles aux visiteurs',ok(await anon.from('contacts').select('id').eq('email',contactEmail)).length===0);
    check('doublon newsletter identifié côté serveur',(await service.from('contacts').insert({email:contactEmail,consent:true})).error?.code==='23505');
    const slot={p_key:createHash('sha256').update(run).digest('hex'),p_limit:5,p_window_seconds:60};
    const slots=await Promise.all(Array.from({length:10},()=>service.rpc('take_request_slot',slot)));
    check('dix demandes simultanées : cinq créneaux au maximum',slots.filter(r=>ok(r)===true).length===5);
    check('compteurs anti-spam inaccessibles aux visiteurs',Boolean((await anon.rpc('take_request_slot',slot)).error));
    check('ancien miroir de favoris non modifiable publiquement',Boolean((await anon.from('favorites').insert({visitor_id:'qa-'+run,event_id:first.id})).error));
    const simultaneous=await Promise.all(Array.from({length:25},()=>owner.rpc('save_event_transaction',{...request,p_submission_id:crypto.randomUUID(),p_input:{...payload,recurrence:null,recurrence_count:null,occurrences:[]}})));
    check('25 dépôts concurrents pour 24 crédits : 24 réussites, solde zéro',simultaneous.filter(r=>!r.error).length===24&&await balance()===0);
    check('plus aucun dépôt possible à solde nul',Boolean((await owner.rpc('save_event_transaction',{...request,p_submission_id:crypto.randomUUID()})).error));
  }finally{
    ok(await service.from('contacts').delete().eq('email',contactEmail));
    if(objectPath)ok(await service.storage.from('images').remove([objectPath]));
    if(practitionerId)ok(await service.from('practitioners').delete().eq('id',practitionerId));
    if(userId)ok(await service.auth.admin.deleteUser(userId));
    console.log('Fixtures temporaires de cette exécution supprimées ; comptes de recette conservés.');
  }
}
