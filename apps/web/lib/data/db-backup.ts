import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { getSql } from "@/lib/sql";
import { sendOpsAlert } from "@/lib/data/ops-alerts";

const KEEP = 14;
const PREFIX = "hulakico-";

type BackupState = { scheduled: boolean; lastRunAt: string | null; lastError: string | null };

/** Shared across bundles (instrumentation and routes load this file separately). */
export function backupState(): BackupState {
  const holder = globalThis as typeof globalThis & { __hulakicoBackup?: BackupState };
  holder.__hulakicoBackup ??= { scheduled: false, lastRunAt: null, lastError: null };
  return holder.__hulakicoBackup;
}

export function backupDir(): string | null {
  const dir = process.env.BACKUP_DIR?.trim();
  return dir ? dir : null;
}

function nepalDay(now = new Date()): string {
  return now.toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" });
}

/** Every table, every row, as one JSON document. */
async function dumpDatabase(): Promise<{ tables: Record<string, unknown[]>; counts: Record<string, number> }> {
  const db = await getSql();
  const names = (await db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
    .all()) as Array<{ name: string }>;
  const tables: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};
  for (const { name } of names) {
    if (!/^[A-Za-z0-9_]+$/.test(name)) continue;
    const rows = (await db.prepare(`SELECT * FROM "${name}"`).all()) as unknown[];
    tables[name] = rows;
    counts[name] = rows.length;
  }
  return { tables, counts };
}

/** Re-reads the written file and checks every table has the same number of rows. */
async function verify(file: string, counts: Record<string, number>): Promise<string | null> {
  const parsed = JSON.parse(gunzipSync(await readFile(file)).toString("utf8")) as { tables: Record<string, unknown[]> };
  for (const [name, count] of Object.entries(counts)) {
    if ((parsed.tables[name]?.length ?? -1) !== count) return `Table ${name}: expected ${count} rows in the backup.`;
  }
  return null;
}

async function prune(dir: string): Promise<void> {
  const files = (await readdir(dir)).filter((name) => name.startsWith(PREFIX) && name.endsWith(".json.gz")).sort();
  for (const old of files.slice(0, Math.max(files.length - KEEP, 0))) await rm(path.join(dir, old), { force: true });
}

/**
 * Nightly backup: writes hulakico-YYYY-MM-DD.json.gz (Nepal date), verifies it, keeps the
 * newest 14, and emails the owner if anything fails. Skips when today's file already exists.
 */
export async function runNightlyBackup(): Promise<{ ok: true; file: string | null } | { error: string }> {
  const dir = backupDir();
  if (!dir) return { ok: true, file: null };
  const file = path.join(dir, `${PREFIX}${nepalDay()}.json.gz`);
  backupState().lastRunAt = new Date().toISOString();
  try {
    await mkdir(dir, { recursive: true });
    const exists = await stat(file).then(() => true, () => false);
    if (exists) return { ok: true, file: null };
    const { tables, counts } = await dumpDatabase();
    const json = JSON.stringify({ createdAt: new Date().toISOString(), counts, tables }, (_key, value) => (typeof value === "bigint" ? Number(value) : value));
    await writeFile(`${file}.part`, gzipSync(json), { mode: 0o600 });
    const problem = await verify(`${file}.part`, counts);
    if (problem) throw new Error(problem);
    await writeFile(file, await readFile(`${file}.part`), { mode: 0o600 });
    await rm(`${file}.part`, { force: true });
    await prune(dir);
    backupState().lastError = null;
    console.info("[db-backup.ts:runNightlyBackup] saved", path.basename(file), Object.values(counts).reduce((a, b) => a + b, 0), "rows");
    return { ok: true, file };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[db-backup.ts:runNightlyBackup]", message);
    // Short, path-free reason for the health check.
    backupState().lastError = message.replace(/\/[^\s]*/g, "…").slice(0, 120);
    await sendOpsAlert("backup", "Nightly database backup failed", `The backup for ${nepalDay()} was not saved.\n${message}`);
    return { error: message };
  }
}

/** Newest backup's date and size, for the health check. */
export async function latestBackup(): Promise<{ name: string; bytes: number; at: string } | null> {
  const dir = backupDir();
  if (!dir) return null;
  try {
    const files = (await readdir(dir)).filter((name) => name.startsWith(PREFIX) && name.endsWith(".json.gz")).sort();
    const name = files.at(-1);
    if (!name) return null;
    const info = await stat(path.join(dir, name));
    return { name, bytes: info.size, at: info.mtime.toISOString() };
  } catch (error) {
    console.error("[db-backup.ts:latestBackup]", error instanceof Error ? error.message : error);
    return null;
  }
}
