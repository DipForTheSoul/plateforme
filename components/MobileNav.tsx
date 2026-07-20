"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

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
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
        aria-expanded={open}
        className="rounded-lg p-2 text-soul-brown"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-16 border-b border-soul-bronze/15 bg-soul-cream shadow-lg">
          <nav className="flex flex-col gap-1 p-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-soul-brown hover:bg-soul-sand/50"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={authLink.href}
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 justify-center"
            >
              {authLink.label}
            </Link>
            <div className="mt-3 flex justify-center">
              <LocaleSwitcher />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
