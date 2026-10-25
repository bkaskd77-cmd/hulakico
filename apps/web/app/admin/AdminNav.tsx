"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { StaffRole } from "@/lib/data/staff-auth";
import { canAccess, type StaffArea } from "@/lib/domain/staff-permissions";

type NavLink = { href: string; label: string; area: StaffArea };

const GROUPS: ReadonlyArray<{ label: string; links: ReadonlyArray<NavLink> }> = [
  {
    label: "Operations",
    links: [
      { href: "/admin", label: "AI tower", area: "operations" },
      { href: "/admin/shipments", label: "Shipments", area: "operations" },
      { href: "/admin/exceptions", label: "Exceptions", area: "operations" },
      { href: "/admin/payments", label: "Payments", area: "operations" },
      { href: "/admin/cod", label: "COD", area: "operations" },
      { href: "/admin/messages", label: "Messages", area: "operations" },
      { href: "/admin/notifications", label: "Notifications", area: "operations" },
    ],
  },
  { label: "Pricing", links: [{ href: "/admin/carriers", label: "Rate card", area: "carriers" }] },
  {
    label: "Website",
    links: [
      { href: "/admin/homepage", label: "Homepage", area: "content" },
      { href: "/admin/services", label: "Services", area: "content" },
      { href: "/admin/pages", label: "Pages", area: "content" },
      { href: "/admin/notes", label: "Notes", area: "content" },
      { href: "/admin/contact", label: "Contact", area: "content" },
    ],
  },
  { label: "Team", links: [{ href: "/admin/team", label: "Team & activity", area: "team" }] },
];

const BASE = "shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm font-semibold transition";
const IDLE = "border-[color-mix(in_srgb,var(--off-white)_22%,transparent)] text-[var(--off-white)] hover:border-[#ffcc00] hover:bg-[color-mix(in_srgb,#ffcc00_14%,transparent)]";
const ACTIVE = "border-[#ffcc00] bg-[#ffcc00] text-[#191919] shadow-sm";

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/**
 * Grouped Admin menu. One swipeable row on phones, labelled groups on wider screens.
 * Clicks give instant feedback instead of waiting for the next page payload.
 */
export function AdminNav({ role }: { role: StaffRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const groups = GROUPS.map((group) => ({ ...group, links: group.links.filter((link) => canAccess(role, link.area)) }))
    .filter((group) => group.links.length > 0);

  return (
    <nav aria-label="Admin" aria-busy={pending}
      className={`-mx-6 flex snap-x scroll-px-6 gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:items-end sm:gap-x-5 sm:gap-y-3 sm:overflow-visible sm:px-0 ${pending ? "opacity-70" : ""}`}>
      {groups.map((group) => (
        <div key={group.label} role="group" aria-label={group.label} className="flex shrink-0 snap-start items-center gap-2 sm:flex-col sm:items-start sm:gap-1.5">
          <span className="hidden text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)] sm:block">{group.label}</span>
          <div className="flex gap-2 sm:flex-wrap">
            {group.links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <Link key={link.href} href={link.href} prefetch aria-current={active ? "page" : undefined}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                    event.preventDefault();
                    startTransition(() => router.push(link.href));
                  }}
                  className={`${BASE} ${active ? ACTIVE : IDLE}`}>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
