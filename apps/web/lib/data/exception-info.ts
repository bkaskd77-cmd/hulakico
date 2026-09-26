import { getSql } from "@/lib/sql";
import { newId } from "@/lib/domain/auth";
import { logCustomerNotification } from "@/lib/data/notifications";

export async function requestExceptionInfo(
  exceptionId: string,
  infoRequestNote: string,
): Promise<void> {
  try {
    const note = infoRequestNote.trim();
    if (note.length < 5) {
      throw new Error("Info request must be at least 5 characters.");
    }

    const db = await getSql();
    const exception = (await db
      .prepare(
        `SELECT id, shipment_id, status FROM exception_cases WHERE id = ?`,
      )
      .get(exceptionId)) as
      | { id: string; shipment_id: string; status: string }
      | undefined;

    if (!exception) throw new Error("Exception not found.");
    if (exception.status !== "OPEN" && exception.status !== "INFO_REQUIRED") {
      throw new Error("Exception is already resolved.");
    }

    const now = new Date().toISOString();
    await db.prepare(
      `UPDATE exception_cases
       SET status = 'INFO_REQUIRED', info_request_note = ?, info_requested_at = ?,
           customer_reply = NULL
       WHERE id = ?`,
    ).run(note, now, exceptionId);

    await db.prepare(
      `INSERT INTO tracking_events (id, shipment_id, status, description, location, occurred_at)
       VALUES (?, ?, 'HOLD', ?, NULL, ?)`,
    ).run(
      newId("evt"),
      exception.shipment_id,
      `On hold — info needed: ${note}`,
      now,
    );

    const notify = await logCustomerNotification({
      shipmentId: exception.shipment_id,
      kind: "HOLD",
      subject: "Hulakico — info needed for your shipment",
      body: `Your shipment is on hold. Ops asked: ${note}`,
    });
    if ("error" in notify) {
      console.error("[exception-info.ts:requestExceptionInfo]", notify.error);
    }
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

export async function submitCustomerReply(
  trackingToken: string,
  reply: string,
): Promise<{ ok: true } | { error: string }> {
  try {
    const trimmed = reply.trim();
    if (trimmed.length < 3) {
      return { error: "Reply must be at least 3 characters." };
    }

    const db = await getSql();
    const row = (await db
      .prepare(
        `SELECT e.id as exception_id, e.shipment_id
         FROM shipments s
         JOIN exception_cases e ON e.shipment_id = s.id
         WHERE s.tracking_token = ? AND e.status = 'INFO_REQUIRED'
         ORDER BY e.created_at DESC
         LIMIT 1`,
      )
      .get(trackingToken)) as
      | { exception_id: string; shipment_id: string }
      | undefined;

    if (!row) {
      return { error: "No open info request for this shipment." };
    }

    const now = new Date().toISOString();
    await db.prepare(
      `UPDATE exception_cases SET customer_reply = ? WHERE id = ?`,
    ).run(trimmed, row.exception_id);

    await db.prepare(
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
