import { Link } from "@/i18n/navigation";

export interface PractitionerNavigationItem {
  href: string;
  label: string;
  badge?: boolean;
}

export function PractitionerNavigation({ items }: { items: PractitionerNavigationItem[] }) {
  return (
    <nav className="grid grid-cols-2 gap-3 md:flex md:flex-col md:gap-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="relative flex min-h-12 min-w-0 items-center justify-center rounded-xl border border-soul-bronze/25 bg-white px-3 py-2 text-center text-sm font-medium leading-tight text-soul-brown hover:bg-soul-sand/50 md:min-h-0 md:justify-start md:border-0 md:bg-transparent md:px-4"
        >
          {item.label}
          {item.badge && (
            <span className="ml-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
              1
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
