import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";

export type ExceptionCaseRow = {
  id: string;
  shipmentId: string;
  status: "OPEN" | "INFO_REQUIRED" | "RESOLVED";
  reason: string;
  previousStatus: string;
  resolutionNote: string | null;
  infoRequestNote: string | null;
  customerReply: string | null;
  createdAt: string;
  resolvedAt: string | null;
  hulakicoAwb: string | null;
  route: string;
};

export function openException(
  userId: string,
  shipmentId: string,
  reason: string,
): { id: string } {
  try {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      throw new Error("Exception reason must be at least 5 characters.");
    }

    const db = getDb();
    const shipment = db
      .prepare(`SELECT id, status FROM shipments WHERE id = ?`)
      .get(shipmentId) as { id: string; status: string } | undefined;
    if (!shipment) throw new Error("Shipment not found.");

    const existing = db
      .prepare(
        `SELECT id FROM exception_cases
         WHERE shipment_id = ? AND status IN ('OPEN', 'INFO_REQUIRED')`,
      )
      .get(shipmentId);
    if (existing) throw new Error("Shipment already has an open exception.");

    const id = newId("exc");
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO exception_cases
       (id, shipment_id, opened_by_user_id, status, reason, previous_status, created_at)
       VALUES (?, ?, ?, 'OPEN', ?, ?, ?)`,
    ).run(id, shipmentId, userId, trimmed, shipment.status, now);

    db.prepare(
      `UPDATE shipments SET status = 'EXCEPTION', updated_at = ? WHERE id = ?`,
    ).run(now, shipmentId);

    db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, 'HOLD', ?, NULL, ?)`,
    ).run(newId("evt"), shipmentId, `On hold: ${trimmed}`, now);

    return { id };
  } catch (error) {
    console.error(
      "[exceptions.ts:openException]",
      error instanceof Error ? error.message : error,
    );
    throw error instanceof Error ? error : new Error("Could not open exception.");
  }
}

export function resolveException(
  exceptionId: string,
  resolutionNote: string,
): void {
  try {
    const note = resolutionNote.trim();
    if (note.length < 3) {
      throw new Error("Resolution note must be at least 3 characters.");
    }

    const db = getDb();
    const exception = db
      .prepare(
        `SELECT id, shipment_id, status, previous_status
         FROM exception_cases WHERE id = ?`,
      )
      .get(exceptionId) as
      | {
          id: string;
          shipment_id: string;
          status: string;
          previous_status: string;
        }
      | undefined;

    if (!exception) throw new Error("Exception not found.");
    if (exception.status !== "OPEN" && exception.status !== "INFO_REQUIRED") {
      throw new Error("Exception is already resolved.");
    }

    const restoreStatus =
      exception.previous_status === "EXCEPTION"
        ? "HANDOVER_PENDING"
        : exception.previous_status;
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE exception_cases
       SET status = 'RESOLVED', resolution_note = ?, resolved_at = ?
       WHERE id = ?`,
    ).run(note, now, exceptionId);

    db.prepare(
      `UPDATE shipments SET status = ?, updated_at = ? WHERE id = ?`,
    ).run(restoreStatus, now, exception.shipment_id);

    db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, ?, ?, NULL, ?)`,
    ).run(
      newId("evt"),
      exception.shipment_id,
      restoreStatus,
      `Hold cleared: ${note}`,
      now,
    );
  } catch (error) {
    console.error(
      "[exceptions.ts:resolveException]",
      error instanceof Error ? error.message : error,
    );
    throw error instanceof Error
      ? error
      : new Error("Could not resolve exception.");
  }
}
