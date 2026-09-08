"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useTransition, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";

type Updates = Record<string, string | undefined>;
const NavigationContext = createContext<((updates: Updates, reset?: boolean) => void) | null>(null);

/** One pending query for the filters AND view switch, before server navigation settles. */
export function ExplorerNavigation({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const pendingQuery = useRef<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (pendingQuery.current === currentQuery) pendingQuery.current = null;
  }, [currentQuery]);
  useEffect(() => {
    const onHistory = () => { pendingQuery.current = null; };
    window.addEventListener("popstate", onHistory);
    return () => window.removeEventListener("popstate", onHistory);
  }, []);

  const update = useCallback((updates: Updates, reset = false) => {
    const params = new URLSearchParams(reset ? "" : pendingQuery.current ?? currentQuery);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    pendingQuery.current = query;
    startTransition(() => router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false }));
  }, [currentQuery, pathname, router]);

  return <NavigationContext.Provider value={update}>{children}</NavigationContext.Provider>;
}

export function useExplorerNavigation() {
  const update = useContext(NavigationContext);
  if (!update) throw new Error("ExplorerNavigation is required around catalogue controls");
  return update;
}
