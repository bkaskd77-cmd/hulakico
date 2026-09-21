import { getDb } from "@/lib/db";

export function getDraftShipmentForUser(userId: string, shipmentId: string) {
  try {
    return (
      (getDb()
        .prepare(
          `SELECT id, status, lane, transport_mode, origin_city, destination_city,
                  package_type, wants_cod, service_class, contents, declared_value,
                  currency, origin_address, destination_address,
                  origin_country, destination_country
           FROM shipments WHERE id = ? AND user_id = ?`,
        )
        .get(shipmentId, userId) as
        | {
            id: string;
            status: string;
            lane: string;
            transport_mode: string;
            origin_city: string;
            destination_city: string;
            package_type: string;
            wants_cod: number;
            service_class: string;
            contents: string;
            declared_value: number | null;
            currency: string;
            origin_address: string;
            destination_address: string;
            origin_country: string;
            destination_country: string;
          }
        | undefined) ?? null
    );
  } catch (error) {
    console.error(
      "[shipment-query.ts:getDraftShipmentForUser]",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}
