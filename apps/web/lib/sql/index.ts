import { createClient } from "@libsql/client/web";
import { createLocalSql } from "@/lib/sql/local";
import { createRemoteSql } from "@/lib/sql/remote";
import { syncRemoteSchema } from "@/lib/sql/schema-sync";
import type { Sql } from "@/lib/sql/types";

export type { Sql, SqlStatement, RunResult } from "@/lib/sql/types";

let remote: Sql | null = null;
let schemaReady: Promise<void> | null = null;

export async function getSql(): Promise<Sql> {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) return createLocalSql();
    if (!remote) {
      const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
      remote = createRemoteSql(client, client);
    }
    if (!schemaReady) schemaReady = syncRemoteSchema(remote);
    await schemaReady;
    return remote;
  } catch (error) {
    schemaReady = null;
    console.error(
      "[sql/index.ts:getSql] Failed to open database:",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Database unavailable.");
  }
}
