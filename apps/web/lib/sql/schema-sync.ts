import { DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import type { Sql } from "@/lib/sql/types";
import { ensureSchema } from "@/lib/db-schema";

type MasterRow = { type: string; name: string; tbl_name: string; sql: string };
type ColumnInfo = { name: string; type: string; notnull: number; dflt_value: string | null };

function readTargetSchema(): { objects: MasterRow[]; columns: Map<string, ColumnInfo[]> } {
  const memory = new DatabaseSync(":memory:");
  try {
    ensureSchema(memory);
    const objects = memory
      .prepare(
        `SELECT type, name, tbl_name, sql FROM sqlite_master
         WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%'
         ORDER BY CASE type WHEN 'table' THEN 0 ELSE 1 END, name`,
      )
      .all() as MasterRow[];
    const columns = new Map<string, ColumnInfo[]>();
    for (const table of objects.filter((o) => o.type === "table")) {
      columns.set(
        table.name,
        memory.prepare(`PRAGMA table_info(${table.name})`).all() as ColumnInfo[],
      );
    }
    return { objects, columns };
  } finally {
    memory.close();
  }
}

function columnDefinition(column: ColumnInfo): string {
  const parts = [column.name, column.type];
  if (column.dflt_value !== null) {
    if (column.notnull) parts.push("NOT NULL");
    parts.push(`DEFAULT ${column.dflt_value}`);
  }
  return parts.join(" ");
}

function ifNotExists(ddl: string): string {
  return ddl.replace(
    /^CREATE\s+(UNIQUE\s+)?(TABLE|INDEX)\s+(?!IF NOT EXISTS)/i,
    (_match, unique: string | undefined, kind: string) =>
      `CREATE ${unique ?? ""}${kind} IF NOT EXISTS `,
  );
}

export async function syncRemoteSchema(sql: Sql): Promise<void> {
  try {
    const target = readTargetSchema();
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(target.objects.map((o) => o.sql)))
      .digest("hex");

    await sql.exec(
      "CREATE TABLE IF NOT EXISTS _schema_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
    );
    const current = (await sql
      .prepare("SELECT value FROM _schema_meta WHERE key = 'fingerprint'")
      .get()) as { value: string } | undefined;
    if (current?.value === fingerprint) return;

    const existing = (await sql
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()) as Array<{ name: string }>;
    const existingTables = new Set(existing.map((row) => row.name));

    for (const object of target.objects) {
      if (object.type === "table" && existingTables.has(object.name)) {
        const remoteColumns = (await sql
          .prepare(`PRAGMA table_info(${object.name})`)
          .all()) as ColumnInfo[];
        const remoteNames = new Set(remoteColumns.map((column) => column.name));
        for (const column of target.columns.get(object.name) ?? []) {
          if (!remoteNames.has(column.name)) {
            await sql.exec(`ALTER TABLE ${object.name} ADD COLUMN ${columnDefinition(column)}`);
          }
        }
        continue;
      }
      await sql.exec(ifNotExists(object.sql));
    }

    await sql
      .prepare(
        `INSERT INTO _schema_meta (key, value) VALUES ('fingerprint', ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      )
      .run(fingerprint);
  } catch (error) {
    console.error(
      "[schema-sync.ts:syncRemoteSchema]",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Could not prepare the database schema.");
  }
}
