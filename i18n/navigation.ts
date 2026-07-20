import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Wrappers de navigation localisés (à utiliser à la place de next/link). */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
