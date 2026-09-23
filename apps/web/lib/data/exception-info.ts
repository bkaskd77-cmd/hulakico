import { getDb } from "@/lib/db";
import { newId } from "@/lib/domain/auth";

export function requestExceptionInfo(
  exceptionId: string,
  infoRequestNote: string,
): void {
  try {
    const note = infoRequestNote.trim();
    if (note.length < 5) {
      throw new Error("Info request must be at least 5 characters.");
    }

    const db = getDb();
    const exception = db
      .prepare(
        `SELECT id, shipment_id, status FROM exception_cases WHERE id = ?`,
      )
      .get(exceptionId) as
      | { id: string; shipment_id: string; status: string }
      | undefined;

    if (!exception) throw new Error("Exception not found.");
    if (exception.status !== "OPEN" && exception.status !== "INFO_REQUIRED") {
      throw new Error("Exception is already resolved.");
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE exception_cases
       SET status = 'INFO_REQUIRED', info_request_note = ?, info_requested_at = ?,
           customer_reply = NULL
       WHERE id = ?`,
    ).run(note, now, exceptionId);

    db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, 'HOLD', ?, NULL, ?)`,
    ).run(
      newId("evt"),
      exception.shipment_id,
      `On hold — info needed: ${note}`,
      now,
    );
  } catch (error) {
    console.error(
      "[exception-info.ts:requestExceptionInfo]",
      error instanceof Error ? error.message : error,
    );
    throw error instanceof Error
      ? error
      : new Error("Could not request customer info.");
  }
}

export function submitCustomerReply(
  trackingToken: string,
  reply: string,
): { ok: true } | { error: string } {
  try {
    const trimmed = reply.trim();
    if (trimmed.length < 3) {
      return { error: "Reply must be at least 3 characters." };
    }

    const db = getDb();
    const row = db
      .prepare(
        `SELECT e.id as exception_id, e.shipment_id
         FROM shipments s
         JOIN exception_cases e ON e.shipment_id = s.id
         WHERE s.tracking_token = ? AND e.status = 'INFO_REQUIRED'
         ORDER BY e.created_at DESC
         LIMIT 1`,
      )
      .get(trackingToken) as
      | { exception_id: string; shipment_id: string }
      | undefined;

    if (!row) {
      return { error: "No open info request for this shipment." };
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE exception_cases SET customer_reply = ? WHERE id = ?`,
    ).run(trimmed, row.exception_id);

    db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, 'HOLD', ?, NULL, ?)`,
    ).run(
      newId("evt"),
      row.shipment_id,
      `Hold update — customer replied: ${trimmed}`,
      now,
    );

    return { ok: true };
  } catch (error) {
    console.error(
      "[exception-info.ts:submitCustomerReply]",
      error instanceof Error ? error.message : error,
    );
    return { error: "Failed to submit reply." };
  }
}
