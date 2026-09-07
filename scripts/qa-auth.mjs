import assert from 'node:assert/strict';
import {createClient} from '@supabase/supabase-js';
import {createServerClient} from '@supabase/ssr';

/** Real local Auth, captured emails, PKCE and the actual Next callback. Never prints tokens. */
export async function verifyAuthLocal(config,password){
  assert.equal(config.API_URL,'http://127.0.0.1:54321');
  const jar=new Map();
  const make=()=>createServerClient(config.API_URL,config.ANON_KEY,{cookies:{
    getAll:()=>[...jar].map(([name,value])=>({name,value})),
    setAll:entries=>entries.forEach(({name,value})=>value?jar.set(name,value):jar.delete(name)),
  }});
  const service=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const email=`auth-${crypto.randomUUID()}@forthesoul.test`;let userId;let client=make();
  const ok=result=>{if(result.error)throw new Error(`Local Auth check failed: ${result.error.code??result.error.status??'unknown'}`);return result.data;};
  const check=(name,value)=>{assert.ok(value,name);console.log('PASS '+name);};
  const seen=new Set();
  async function followEmail(){
    let message;
    for(let i=0;i<25&&!message;i++){
      const listing=await (await fetch('http://127.0.0.1:54324/api/v1/messages')).json();
      message=listing.messages.find(m=>!seen.has(m.ID)&&m.To.some(to=>to.Address===email));
      if(!message)await new Promise(resolve=>setTimeout(resolve,200));
    }
    assert.ok(message,'Expected local email');seen.add(message.ID);
    const detail=await (await fetch(`http://127.0.0.1:54324/api/v1/message/${message.ID}`)).json();
    const links=[...(detail.HTML??'').matchAll(/href="([^"]+)"/g)].map(m=>m[1].replaceAll('&amp;','&'));
    const url=links.find(link=>link.startsWith(config.API_URL+'/auth/v1/verify?'));
    assert.ok(url,'Expected local Auth verification link');
    const verification=await fetch(url,{redirect:'manual'});
    const callback=new URL(verification.headers.get('location'));
    assert.equal(callback.origin,'http://localhost:3100');assert.equal(callback.pathname,'/api/auth/callback');
    assert.ok(callback.searchParams.has('code'),'Expected PKCE code');
    const response=await fetch(callback,{redirect:'manual',headers:{cookie:[...jar].map(([name,value])=>`${name}=${value}`).join('; ')}});
    for(const cookie of response.headers.getSetCookie()){
      const pair=cookie.split(';',1)[0];const index=pair.indexOf('=');const name=pair.slice(0,index),value=pair.slice(index+1);
      if(value)jar.set(name,value);else jar.delete(name);
    }
    assert.ok([302,303,307].includes(response.status),'Expected callback redirect');
    return new URL(response.headers.get('location'));
  }
  try{
    const signup=ok(await client.auth.signUp({email,password,options:{emailRedirectTo:'http://localhost:3100/api/auth/callback?next=/de/espace-praticien',data:{role:'practitioner',name:'QA Auth temporaire',preferred_lang:'de'}}}));
    userId=signup.user.id;
    check('inscription non connectée avant confirmation',signup.session===null);
    check('fiche créée automatiquement en attente',ok(await service.from('practitioners').select('status').eq('user_id',userId).single()).status==='pending');
    check('connexion refusée avant vérification e-mail',Boolean((await make().auth.signInWithPassword({email,password})).error));
    const destination=await followEmail();check('confirmation PKCE via la route Next, langue conservée',destination.pathname==='/de/espace-praticien');
    client=make();check('session utilisable après confirmation',ok(await client.auth.getUser()).user.id===userId);
    ok(await client.auth.signOut());jar.clear();client=make();
    ok(await client.auth.resetPasswordForEmail(email,{redirectTo:'http://localhost:3100/api/auth/callback?next=/de/reinitialiser-mot-de-passe'}));
    check('lien de récupération vers la page allemande',(await followEmail()).pathname==='/de/reinitialiser-mot-de-passe');
    client=make();const replacement='Fts-QA-Changed-2026!';ok(await client.auth.updateUser({password:replacement}));ok(await client.auth.signOut());jar.clear();client=make();
    check('ancien mot de passe refusé après remplacement',Boolean((await client.auth.signInWithPassword({email,password})).error));
    check('nouveau mot de passe accepté',ok(await client.auth.signInWithPassword({email,password:replacement})).user.id===userId);
  }finally{
    await client.auth.signOut();
    if(userId){ok(await service.from('practitioners').delete().eq('user_id',userId));ok(await service.auth.admin.deleteUser(userId));}
    console.log('Compte Auth temporaire supprimé ; e-mails fictifs conservés dans Mailpit.');
  }
}
