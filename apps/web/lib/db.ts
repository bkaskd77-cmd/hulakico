import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { ensureSchema } from "@/lib/db-schema";

const DEFAULT_DB = process.env.VERCEL
  ? path.join("/tmp", "hulakico.db")
  : path.join(process.cwd(), "data", "hulakico.db");

let db: DatabaseSync | null = null;
let schemaReady = false;

export function getDb(): DatabaseSync {
  try {
    if (!db) {
      const dbPath = process.env.DATABASE_PATH || DEFAULT_DB;
      fs.mkdirSync(path.dirname(dbPath), { recursive: true });
      db = new DatabaseSync(dbPath);
    }
    if (!schemaReady) {
      ensureSchema(db);
      schemaReady = true;
    }
    return db;
  } catch (error) {
    console.error(
      "[db.ts:getDb] Failed to open database:",
      error instanceof Error ? error.message : error,
    );
    throw new Error("Database unavailable.");
  }
}
