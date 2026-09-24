import Link from "next/link";

const LINKS = [
  { href: "/admin", label: "AI tower" },
  { href: "/admin/shipments", label: "Shipments" },
  { href: "/admin/exceptions", label: "Exceptions" },
  { href: "/admin/cod", label: "COD" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/carriers", label: "Carriers" },
] as const;

export function AdminNav() {
  return (
    <nav className="flex flex-wrap gap-3 text-sm">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="text-[var(--teal)] underline"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
