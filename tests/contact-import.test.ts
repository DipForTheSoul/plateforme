import { beforeEach, expect, it, vi } from 'vitest';
import { importContacts } from '@/app/actions/contacts';

const state = vi.hoisted(() => ({ rows: [] as Record<string, unknown>[], adminCalls: 0 }));

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/lib/auth', () => ({ getCurrentProfile: async () => ({ role: 'admin' }) }));
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => { throw new Error('The browser-role client must not insert imported contacts.'); },
}));
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => {
    state.adminCalls++;
    return {
      from: () => ({
        upsert: (rows: Record<string, unknown>[]) => {
          state.rows = rows;
          return { select: async () => ({ data: rows.map((_, index) => ({ id: String(index) })), error: null }) };
        },
      }),
    };
  },
}));

beforeEach(() => {
  state.rows = [];
  state.adminCalls = 0;
});

it('importe un export Wix avec le client serveur après le contrôle admin', async () => {
  const formData = new FormData();
  formData.set('csv', 'Last Name,Labels,Email,First Name\nPicamoles,"danse,meditation",DIDIER@example.test,Didier');

  const result = await importContacts({}, formData);

  expect(result).toEqual({ success: 'imported:1' });
  expect(state.adminCalls).toBe(1);
  expect(state.rows).toEqual([expect.objectContaining({
    email: 'didier@example.test',
    first_name: 'Didier',
    last_name: 'Picamoles',
    interests: ['danse', 'meditation'],
    consent: true,
    source: 'import-wix',
  })]);
});

it('renvoie un code traduisible quand aucune source CSV n’est fournie', async () => {
  expect(await importContacts({}, new FormData())).toEqual({ error: 'empty' });
  expect(state.adminCalls).toBe(0);
});
