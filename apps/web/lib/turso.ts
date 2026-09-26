import { createClient } from "@libsql/client/web";
import { getDb } from "@/lib/db";

export type SqlArg = string | number | null;
export type SqlStatement = { sql: string; args: SqlArg[] };
export type SqlRow = Record<string, unknown>;

export interface SqlClient {
  execute(statement: SqlStatement): Promise<{ rows: SqlRow[] }>;
  batch(statements: SqlStatement[]): Promise<void>;
}

const AUTH_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    account_type TEXT NOT NULL CHECK (account_type IN ('INDIVIDUAL', 'BUSINESS')),
    platform_role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (
      platform_role IN ('CUSTOMER', 'OPS', 'ADMIN')
    ),
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS memberships (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    UNIQUE (user_id, organization_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
  );
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`;

let remote: SqlClient | null = null;
let schemaReady: Promise<void> | null = null;

function createRemoteClient(url: string): SqlClient {
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return {
    async execute(statement) {
      const result = await client.execute(statement);
      return { rows: result.rows as unknown as SqlRow[] };
    },
    async batch(statements) {
      await client.batch(statements, "write");
    },
  };
}

function createLocalClient(): SqlClient {
  return {
    async execute({ sql, args }) {
      const statement = getDb().prepare(sql);
      if (/^\s*(SELECT|WITH|PRAGMA)/i.test(sql)) {
        return { rows: statement.all(...args) as SqlRow[] };
      }
      statement.run(...args);
      return { rows: [] };
    },
    async batch(statements) {
      const db = getDb();
      db.exec("BEGIN");
      try {
        for (const { sql, args } of statements) {
          db.prepare(sql).run(...args);
        }
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
}

export async function getTurso(): Promise<SqlClient> {
  try {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) return createLocalClient();
    if (!remote) remote = createRemoteClient(url);
    if (!schemaReady) {
      const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
      schemaReady = client.executeMultiple(AUTH_SCHEMA).finally(() => client.close());
    }
    await schemaReady;
    return remote;
  } catch (error) {
    schemaReady = null;
    console.error(
      "[turso.ts:getTurso] Failed to open database:",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Database unavailable.");
  }
}
