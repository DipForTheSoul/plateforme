import "server-only";

import { unstable_cache } from "next/cache";

/** Cache public partagé entre requêtes et instances Vercel. Désactivé en test. */
export function publicCache<T extends () => Promise<unknown>>(
  fn: T,
  key: string[],
  tags: string[],
  revalidate = 300,
): T {
  if (process.env.NODE_ENV === "test") return fn;
  return unstable_cache(fn, key, { tags, revalidate }) as unknown as T;
}
