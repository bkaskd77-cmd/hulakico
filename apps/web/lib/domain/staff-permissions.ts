import type { StaffRole } from "@/lib/data/staff-auth";

export type StaffArea = "operations" | "content" | "carriers" | "team";

const ROLE_AREAS: Record<StaffRole, readonly StaffArea[]> = {
  ADMIN: ["operations", "content", "carriers", "team"],
  EDITOR: ["content"],
  SUB_ADMIN: ["operations"],
};

export const ROLE_LABELS: Record<StaffRole, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  SUB_ADMIN: "Sub-admin",
};

export const ROLE_HINTS: Record<StaffRole, string> = {
  ADMIN: "Everything, including staff accounts",
  EDITOR: "Website content only",
  SUB_ADMIN: "Shipments, exceptions, COD, payments and notifications",
};

export function canAccess(role: StaffRole, area: StaffArea): boolean {
  return ROLE_AREAS[role]?.includes(area) ?? false;
}

export function roleHome(role: StaffRole): string {
  return canAccess(role, "operations") ? "/admin" : "/admin/homepage";
}
