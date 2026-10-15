"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useOptimistic, useRef, useTransition, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";

type Updates = Record<string, string | undefined>;
const NavigationContext = createContext<((updates: Updates, reset?: boolean) => void) | null>(null);
const QueryContext = createContext<URLSearchParams | null>(null);

/** One pending query for the filters AND view switch, before server navigation settles. */
export function ExplorerNavigation({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentQuery = searchParams.toString();
  const settledQuery = useRef(currentQuery);
  const [optimisticQuery, setOptimisticQuery] = useOptimistic(currentQuery);
  const visibleParams = useMemo(() => new URLSearchParams(optimisticQuery), [optimisticQuery]);
  const pendingQuery = useRef<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    settledQuery.current = currentQuery;
    if (pendingQuery.current === currentQuery) pendingQuery.current = null;
  }, [currentQuery]);
  useEffect(() => {
    const onHistory = () => { pendingQuery.current = null; };
    window.addEventListener("popstate", onHistory);
    return () => window.removeEventListener("popstate", onHistory);
  }, []);

  const update = useCallback((updates: Updates, reset = false) => {
    const params = new URLSearchParams(reset ? "" : pendingQuery.current ?? settledQuery.current);
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const query = params.toString();
    pendingQuery.current = query;
    startTransition(() => {
      setOptimisticQuery(query);
      router.replace(`${pathname}${query ? `?${query}` : ""}`, { scroll: false });
    });
  }, [pathname, router, setOptimisticQuery]);

  return <NavigationContext.Provider value={update}><QueryContext.Provider value={visibleParams}>{children}</QueryContext.Provider></NavigationContext.Provider>;
}

export function useExplorerSearchParams() {
  const params = useContext(QueryContext);
  if (!params) throw new Error('ExplorerNavigation is required around catalogue controls');
  return params;
}

export function useExplorerNavigation() {
  const update = useContext(NavigationContext);
  if (!update) throw new Error("ExplorerNavigation is required around catalogue controls");
  return update;
}
