// @vitest-environment node
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, expect, it } from "vitest";

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
    create function public.is_admin() returns boolean language sql stable as $$ select false $$;
    create table public.practitioners (
      id uuid primary key,
      user_id uuid,
      contact jsonb not null default '{}'::jsonb
    );
    insert into public.practitioners(id, user_id, contact)
    values (
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000002',
      '{"email":"person@example.test","phone":"+41000","website":"https://example.test"}'
    );
  `);
  await db.exec(
    readFileSync(
      new URL(
        "../supabase/migrations/20261009154500_private_practitioner_contacts.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
});

afterAll(async () => db.close());

it("retire les coordonnées privées des fiches publiques existantes", async () => {
  const publicRow = await db.query<{ contact: Record<string, string> }>(
    "select contact from public.practitioners",
  );
  expect(publicRow.rows[0].contact).toEqual({ website: "https://example.test" });

  const privateRow = await db.query<{ contact: Record<string, string> }>(
    "select contact from public.practitioner_private_contacts",
  );
  expect(privateRow.rows[0].contact).toMatchObject({
    email: "person@example.test",
    phone: "+41000",
  });
});

it("sépare aussi les coordonnées lors des prochaines mises à jour", async () => {
  await db.exec(`
    update public.practitioners
    set contact = '{"email":"new@example.test","website":"https://new.example.test"}'
    where id = '00000000-0000-4000-8000-000000000001';
  `);
  const publicRow = await db.query<{ contact: Record<string, string> }>(
    "select contact from public.practitioners",
  );
  expect(publicRow.rows[0].contact).toEqual({ website: "https://new.example.test" });
  const privateRow = await db.query<{ contact: Record<string, string> }>(
    "select contact from public.practitioner_private_contacts",
  );
  expect(privateRow.rows[0].contact.email).toBe("new@example.test");
});
