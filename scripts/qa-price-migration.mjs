// Only the isolated local database. No remote connection, reset, seed or deletion.
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const env={...process.env,DOCKER_HOST:`unix://${homedir()}/.colima/forthesoul-qa/docker.sock`,SUPABASE_TELEMETRY_DISABLED:'1'};
const status=spawnSync('supabase',['status','-o','json'],{env,encoding:'utf8'});
assert.equal(status.status,0,'Local Supabase must be running.');
const config=JSON.parse(status.stdout);
assert.equal(new URL(config.API_URL).origin,'http://127.0.0.1:54321');
const client=createClient(config.API_URL,config.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function rows(table){
  const all=[];
  for(let offset=0;;offset+=1000){
    const result=await client.from(table).select('*').order('id').range(offset,offset+999);
    if(result.error)throw new Error(`Read failed: ${table} (${result.error.code})`);
    all.push(...result.data);if(result.data.length<1000)return all;
  }
}
const tables=['events','practitioners','profiles','venues','credit_transactions'];
const before=Object.fromEntries(await Promise.all(tables.map(async t=>[t,await rows(t)])));
const migration=spawnSync('supabase',['migration','up','--local'],{env,encoding:'utf8'});
if(migration.status!==0)throw new Error(`Local migration failed: ${migration.stderr}`);
for(const table of tables){
  const after=await rows(table);
  const strip=rows=>rows.map(row=>Object.fromEntries(Object.entries(row).filter(([k])=>table!=='events'||!['price_mode','updated_at'].includes(k))));
  assert.deepEqual(strip(after),strip(before[table]),`${table}: existing data must remain unchanged`);
  if(table==='events')for(const event of after){
    const original=before.events.find(e=>e.id===event.id);
    assert.equal(event.price_mode,original.price_mode??(original.price===null?'unspecified':Number(original.price)===0?'flexible':'fixed'));
  }
  console.log(`PASS ${table}: ${after.length} rows preserved, existing values unchanged${table==='events'?' (excluding migration timestamp and new pricing mode)':''}.`);
}
