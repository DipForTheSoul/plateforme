import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface NavLink {
  href: string;
  label: string;
}

export function MobileNav({
  links,
  authLink,
}: {
  links: NavLink[];
  authLink: NavLink;
}) {
  return (
    <details className="group xl:hidden">
      <summary
        role="button"
        aria-label="Menu"
        className="cursor-pointer list-none rounded-lg p-2 text-soul-brown [&::-webkit-details-marker]:hidden"
      >
        <Menu className="h-7 w-7" />
      </summary>

      <div className="absolute inset-x-0 top-16 border-b border-soul-bronze/15 bg-soul-cream shadow-lg">
        <nav className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-3 text-lg font-medium text-soul-brown hover:bg-soul-sand/50"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={authLink.href}
            className="btn-primary mt-2 justify-center"
          >
            {authLink.label}
          </Link>
        </nav>
      </div>
    </details>
  );
}
