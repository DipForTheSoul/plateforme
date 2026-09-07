import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const fixture = (name: string) => fileURLToPath(new URL(name, import.meta.url));
export default defineConfig({
  root: fixture('./'), publicDir: root + 'public',
  resolve: { alias: [
    { find: /^@\/app\/actions\/.*$/, replacement: fixture('actions.ts') },
    { find: '@/i18n/navigation', replacement: fixture('navigation.tsx') },
    { find: '@/lib/supabase/client', replacement: fixture('supabase.ts') },
    { find: 'next/image', replacement: fixture('image.tsx') },
    { find: '@', replacement: root },
  ] },
  esbuild: { jsx: 'automatic' },
  server: { host: '127.0.0.1', port: 3101, strictPort: true, fs: { allow: [root] } },
});
