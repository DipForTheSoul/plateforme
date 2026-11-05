import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";
import type {ComponentProps,ComponentType} from 'react';
import type {UrlObject} from 'node:url';

/** Wrappers de navigation localisés (à utiliser à la place de next/link). */
const navigation=createNavigation(routing);
// The route map remains open for existing private/API routes. next-intl also
// supports params at runtime for the explicitly mapped public detail pages.
type LinkProps=Omit<ComponentProps<typeof navigation.Link>,'href'>&{
  href:string|(Omit<UrlObject,'pathname'>&{pathname:string;params?:Record<string,string|string[]>});
};
export const Link=navigation.Link as ComponentType<LinkProps>;
export const {redirect,usePathname,useRouter,getPathname}=navigation;
