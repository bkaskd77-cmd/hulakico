import {
  finishedStatuses,
  retentionCutoffIso,
} from "@/lib/data/shipment-purge";

export const HUB_STATUS_FILTERS = [
  { key: "all", label: "All", statuses: null as string[] | null },
  { key: "draft", label: "Draft", statuses: ["DRAFT", "QUOTED"] },
  { key: "booked", label: "Booked", statuses: ["BOOKED", "HANDOVER_PENDING"] },
  { key: "transit", label: "In transit", statuses: ["IN_TRANSIT", "OUT_FOR_DELIVERY"] },
  { key: "delivered", label: "Delivered", statuses: ["DELIVERED"] },
  { key: "hold", label: "Hold", statuses: ["EXCEPTION"] },
  { key: "closed", label: "Closed", statuses: ["CANCELLED", "RTO"] },
] as const;

export type HubFilterKey = (typeof HUB_STATUS_FILTERS)[number]["key"];

export function resolveHubFilter(raw?: string): HubFilterKey {
  return HUB_STATUS_FILTERS.find((item) => item.key === raw)?.key ?? "all";
}

export function retentionWhere(): { sql: string; params: unknown[] } {
  const finished = finishedStatuses();
  const marks = finished.map(() => "?").join(", ");
  return {
    sql: `user_id = ? AND (status NOT IN (${marks}) OR updated_at >= ?)`,
    params: [...finished, retentionCutoffIso()],
  };
}

export function shipmentHubWhere(
  filter: HubFilterKey,
  q: string,
): { sql: string; params: unknown[] } {
  const base = retentionWhere();
  const parts = [base.sql];
  const params = [...base.params];
  const group = HUB_STATUS_FILTERS.find((item) => item.key === filter);
  if (group?.statuses?.length) {
    parts.push(`status IN (${group.statuses.map(() => "?").join(", ")})`);
    params.push(...group.statuses);
  }
  const needle = q.trim().toLowerCase();
  if (needle) {
    parts.push(
      `(lower(coalesce(hulakico_awb,'')) LIKE ? OR lower(origin_city) LIKE ? OR lower(destination_city) LIKE ?
        OR lower(coalesce(origin_contact_name,'')) LIKE ? OR lower(coalesce(destination_contact_name,'')) LIKE ?
        OR lower(contents) LIKE ?)`,
    );
    const like = `%${needle}%`;
    params.push(like, like, like, like, like, like);
  }
  return { sql: parts.join(" AND "), params };
}
