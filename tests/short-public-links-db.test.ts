// @vitest-environment node
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, expect, it } from 'vitest';
const db=new PGlite();
beforeAll(async()=>{
 await db.exec(`CREATE SCHEMA private; CREATE SCHEMA auth; CREATE TABLE auth.users(id uuid PRIMARY KEY,raw_user_meta_data jsonb);
 CREATE TABLE public.practitioners(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),name text,slug text UNIQUE,contact jsonb DEFAULT '{}',user_id uuid,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
 CREATE TABLE public.events(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text,slug text UNIQUE,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now());
 CREATE ROLE anon; CREATE ROLE authenticated;
 CREATE FUNCTION public.stamp() RETURNS trigger LANGUAGE plpgsql AS $$BEGIN NEW.updated_at=now(); RETURN NEW; END$$;
 CREATE TRIGGER practitioners_updated_at BEFORE UPDATE ON public.practitioners FOR EACH ROW EXECUTE FUNCTION public.stamp();
 CREATE TRIGGER events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.stamp();
 INSERT INTO public.practitioners(name,slug,updated_at) VALUES ('Cynthia','old-cynthia','2026-01-01');
 INSERT INTO public.events(title,slug,updated_at) VALUES ('Danse à Neuchâtel','old-danse','2026-01-01');`);
 await db.exec(readFileSync('supabase/migrations/20261113105225_short_event_practitioner_links.sql','utf8'));
});
afterAll(()=>db.close());
it('ajoute des noms courts sans changer les anciens slugs ni dates de modification',async()=>{
 expect((await db.query('select public_slug,slug,updated_at::date::text as date from public.events')).rows).toEqual([{public_slug:'danse-a-neuchatel',slug:'old-danse',date:'2026-01-01'}]);
 expect((await db.query('select public_slug,slug from public.practitioners')).rows).toEqual([{public_slug:'cynthia',slug:'old-cynthia'}]);
});
it('attribue des adresses distinctes aux nouvelles expériences et aux profils sans erreur de type',async()=>{
 const events=await db.query(`INSERT INTO public.events(title,slug) VALUES ('Même titre','legacy-a'),('Même titre','legacy-b') RETURNING public_slug`);
 expect(events.rows).toEqual([{public_slug:'meme-titre'},{public_slug:'meme-titre-2'}]);
 const profiles=await db.query(`INSERT INTO public.practitioners(name,slug) VALUES ('Cynthia','legacy-p1'),('Cynthia','legacy-p2') RETURNING public_slug`);
 expect(profiles.rows).toEqual([{public_slug:'cynthia-2'},{public_slug:'cynthia-3'}]);
});
it('préfère prénom et nom disponibles, sans marque ajoutée',async()=>{
 const r=await db.query(`INSERT INTO public.practitioners(name,slug,contact) VALUES ('Emanessence - Soins et stages','legacy-e','{"first_name":"Emanuelle","last_name":"Ging"}') RETURNING public_slug`);
 expect(r.rows).toEqual([{public_slug:'emanuelle-ging'}]);
});
it('reprend les prénom et nom de l’inscription quand la fiche utilise un nom court',async()=>{
 await db.exec(`INSERT INTO auth.users VALUES ('10000000-0000-4000-8000-000000000001','{"first_name":"Juliane","last_name":"Seifert"}');`);
 const r=await db.query(`INSERT INTO public.practitioners(name,slug,user_id) VALUES ('Juliane','legacy-j','10000000-0000-4000-8000-000000000001') RETURNING public_slug`);
 expect(r.rows).toEqual([{public_slug:'juliane-seifert'}]);
});
it('garde les adresses après renommage et refuse de les changer par une mise à jour',async()=>{
 const r=await db.query(`UPDATE public.events SET title='Autre titre',public_slug='autre' WHERE slug='legacy-a' RETURNING public_slug`);
 expect(r.rows).toEqual([{public_slug:'meme-titre'}]);
 const p=await db.query(`UPDATE public.practitioners SET name='Autre nom',public_slug='autre' WHERE slug='legacy-p1' RETURNING public_slug`);
 expect(p.rows).toEqual([{public_slug:'cynthia-2'}]);
});
it('borne les titres très longs sans ajouter de suite aléatoire',async()=>{
 const r=await db.query<{public_slug:string}>(`INSERT INTO public.events(title,slug) VALUES ($1,'legacy-long') RETURNING public_slug`,['Un très long titre '.repeat(12)]);
 expect(r.rows[0].public_slug.length).toBeLessThanOrEqual(60);
 expect(r.rows[0].public_slug).not.toMatch(/-[a-f0-9]{10,}$/);
});
it('n’expose pas les fonctions internes aux rôles publics',async()=>{
 const r=await db.query(`SELECT has_function_privilege('anon','private.assign_short_public_slug()','execute') as anon,has_function_privilege('authenticated','private.assign_short_public_slug()','execute') as authenticated`);
 expect(r.rows).toEqual([{anon:false,authenticated:false}]);
});
