"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { StaffRole } from "@/lib/data/staff-auth";
import { canAccess, type StaffArea } from "@/lib/domain/staff-permissions";

const LINKS: ReadonlyArray<{ href: string; label: string; area: StaffArea }> = [
  { href: "/admin", label: "AI tower", area: "operations" },
  { href: "/admin/homepage", label: "Homepage", area: "content" },
  { href: "/admin/services", label: "Services", area: "content" },
  { href: "/admin/shipments", label: "Shipments", area: "operations" },
  { href: "/admin/exceptions", label: "Exceptions", area: "operations" },
  { href: "/admin/cod", label: "COD", area: "operations" },
  { href: "/admin/payments", label: "Payments", area: "operations" },
  { href: "/admin/notifications", label: "Notifications", area: "operations" },
  { href: "/admin/carriers", label: "Carriers", area: "carriers" },
];

const BASE =
  "rounded-md border px-3 py-1.5 text-sm font-semibold transition";
const IDLE =
  "border-[color-mix(in_srgb,var(--off-white)_28%,transparent)] bg-[color-mix(in_srgb,var(--navy)_55%,transparent)] text-[var(--off-white)] hover:border-[var(--gold)] hover:bg-[color-mix(in_srgb,var(--gold)_22%,transparent)] hover:text-[var(--gold)]";
const ACTIVE =
  "border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_28%,transparent)] text-[var(--gold)]";
const PENDING = "opacity-60 pointer-events-none";

/** Instant click feedback — does not wait for the next RSC payload. */
export function AdminNav({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <nav className="flex flex-wrap gap-2" aria-busy={pending}>
      {LINKS.filter((link) => canAccess(role, link.area)).map((link) => {
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
