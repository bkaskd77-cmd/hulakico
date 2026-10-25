#!/usr/bin/env node
// Restores a Hulakico backup (hulakico-YYYY-MM-DD.json.gz from Admin → Team → Download backup)
// into an EMPTY database. Start the app against that database once first, so it creates the tables.
//
//   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/restore-db.mjs path/to/backup.json.gz
//   (or TURSO_DATABASE_URL=file:./restored.db for a local file)
//
// It refuses to write into a database that already has shipments or users.

import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const file = process.argv[2];
const url = process.env.TURSO_DATABASE_URL;
if (!file || !url) {
  console.error("Usage: TURSO_DATABASE_URL=... [TURSO_AUTH_TOKEN=...] node scripts/restore-db.mjs <backup.json.gz>");
  process.exit(1);
}

// Parents before children, so foreign keys always find their row.
const FIRST = ["users", "staff_users", "organizations", "memberships", "carriers", "carrier_services", "shipments", "quotes", "quote_options", "commercial_invoices"];

/** Turso over HTTP (no native module needed), or Node's built-in SQLite for a local file. */
async function openDatabase() {
  if (url.startsWith("file:")) {
    const { DatabaseSync } = await import("node:sqlite");
    const local = new DatabaseSync(url.slice("file:".length));
    return {
      count: (table) => Number(local.prepare(`SELECT COUNT(*) AS n FROM "${table}"`).get().n),
      insertAll: (sql, rows) => {
        local.exec("BEGIN");
        for (const args of rows) local.prepare(sql).run(...args);
        local.exec("COMMIT");
      },
    };
  }
  const { createClient } = await import("@libsql/client/web");
  const remote = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return {
    count: async (table) => Number((await remote.execute(`SELECT COUNT(*) AS n FROM "${table}"`)).rows[0].n),
    insertAll: (sql, rows) => remote.batch(rows.map((args) => ({ sql, args })), "write"),
  };
}

async function main() {
  const backup = JSON.parse(gunzipSync(readFileSync(file)).toString("utf8"));
  const db = await openDatabase();
  for (const table of ["users", "shipments"]) {
    if ((await db.count(table)) > 0) throw new Error(`Table ${table} already has rows; restore only into an empty database.`);
  }
  const names = Object.keys(backup.tables);
  const order = [...FIRST.filter((name) => names.includes(name)), ...names.filter((name) => !FIRST.includes(name)).sort()];
  let total = 0;
  for (const table of order) {
    if (!/^[A-Za-z0-9_]+$/.test(table) || table.startsWith("sqlite_") || table === "_schema_meta") continue;
    const rows = backup.tables[table];
    if (!rows.length) continue;
    const columns = Object.keys(rows[0]);
    const sql = `INSERT OR REPLACE INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`;
    await db.insertAll(sql, rows.map((row) => columns.map((c) => row[c] ?? null)));
    total += rows.length;
    console.log(`${table}: ${rows.length}`);
  }
  console.log(`Restored ${total} rows from ${file} (backup made ${backup.createdAt}).`);
}

main().catch((error) => {
  console.error("[restore-db.mjs]", error instanceof Error ? error.message : error);
  process.exit(1);
});
