import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";

export type CodCollection = {
  id: string;
  shipmentId: string;
  amount: number;
  currency: string;
  status: string;
  hulakicoAwb: string | null;
  route: string;
  createdAt: string;
  collectedAt: string | null;
};

export function createCodCollection(input: {
  shipmentId: string;
  amount: number;
  currency: string;
}): { id: string } | { error: string } {
  try {
    if (!(input.amount > 0)) {
      return { error: "COD amount must be greater than zero." };
    }
    const db = getDb();
    const id = newId("cod");
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO cod_collections
         (id, shipment_id, amount, currency, status, created_at)
       VALUES (?, ?, ?, ?, 'PENDING_COLLECTION', ?)`,
    ).run(id, input.shipmentId, input.amount, input.currency, now);
    return { id };
  } catch (error) {
    console.error(
      "[cod.ts:createCodCollection]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Failed to create COD collection." };
  }
}

export function listCodCollections(
  status?: "PENDING_COLLECTION" | "COLLECTED",
): CodCollection[] {
  try {
    const db = getDb();
    const rows = (
      status
        ? db.prepare(
            `SELECT c.id, c.shipment_id, c.amount, c.currency, c.status,
                    c.created_at, c.collected_at, s.hulakico_awb,
                    s.origin_city, s.destination_city
             FROM cod_collections c
             JOIN shipments s ON s.id = c.shipment_id
             WHERE c.status = ?
             ORDER BY c.created_at DESC`,
          ).all(status)
        : db.prepare(
            `SELECT c.id, c.shipment_id, c.amount, c.currency, c.status,
                    c.created_at, c.collected_at, s.hulakico_awb,
                    s.origin_city, s.destination_city
             FROM cod_collections c
             JOIN shipments s ON s.id = c.shipment_id
             ORDER BY c.created_at DESC`,
          ).all()
    ) as Array<{
      id: string;
      shipment_id: string;
      amount: number;
      currency: string;
      status: string;
      created_at: string;
      collected_at: string | null;
      hulakico_awb: string | null;
      origin_city: string;
      destination_city: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      shipmentId: row.shipment_id,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      hulakicoAwb: row.hulakico_awb,
      route: `${row.origin_city} → ${row.destination_city}`,
      createdAt: row.created_at,
      collectedAt: row.collected_at,
    }));
  } catch (error) {
    console.error(
      "[cod.ts:listCodCollections]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Failed to list COD collections.");
  }
}

export function markCodCollected(
  codId: string,
  note: string,
): { ok: true } | { error: string } {
  try {
    const trimmed = note.trim();
    if (trimmed.length < 2) {
      return { error: "Collection note is required." };
    }
    const db = getDb();
    const now = new Date().toISOString();
    const result = db
      .prepare(
        `UPDATE cod_collections
         SET status = 'COLLECTED', collected_at = ?, note = ?
         WHERE id = ? AND status = 'PENDING_COLLECTION'`,
      )
      .run(now, trimmed, codId);
    if (result.changes === 0) {
      return { error: "COD record not found or already collected." };
    }
    return { ok: true };
  } catch (error) {
    console.error(
      "[cod.ts:markCodCollected]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Failed to mark COD collected." };
  }
}
