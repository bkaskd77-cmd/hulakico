"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

const LINKS = [
  { href: "/admin", label: "AI tower" },
  { href: "/admin/shipments", label: "Shipments" },
  { href: "/admin/exceptions", label: "Exceptions" },
  { href: "/admin/cod", label: "COD" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/carriers", label: "Carriers" },
] as const;

const BASE =
  "rounded-md border px-3 py-1.5 text-sm font-semibold transition";
const IDLE =
  "border-[color-mix(in_srgb,var(--off-white)_28%,transparent)] bg-[color-mix(in_srgb,var(--navy)_55%,transparent)] text-[var(--off-white)] hover:border-[var(--gold)] hover:bg-[color-mix(in_srgb,var(--gold)_22%,transparent)] hover:text-[var(--gold)]";
const ACTIVE =
  "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_28%,transparent)] text-[var(--gold)]";
const PENDING = "opacity-60 pointer-events-none";

/** Instant click feedback — does not wait for the next RSC payload. */
export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <nav className="flex flex-wrap gap-2" aria-busy={pending}>
      {LINKS.map((link) => {
        const active =
          link.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey ||
                event.button !== 0
              ) {
                return;
              }
              event.preventDefault();
              startTransition(() => {
                router.push(link.href);
              });
            }}
            className={`${BASE} ${active ? ACTIVE : IDLE} ${pending ? PENDING : ""}`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
