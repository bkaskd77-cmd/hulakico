import { getDb } from "@/lib/db";
import type { Sql } from "@/lib/sql/types";

let inTransaction = false;

export function createLocalSql(): Sql {
  const sql: Sql = {
    prepare(text) {
      return {
        async get(...params) {
          return getDb().prepare(text).get(...params);
        },
        async all(...params) {
          return getDb().prepare(text).all(...params);
        },
        async run(...params) {
          const result = getDb().prepare(text).run(...params);
          return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) };
        },
      };
    },
    async exec(text) {
      getDb().exec(text);
    },
    async transaction(work) {
      if (inTransaction) return work(sql);
      const db = getDb();
      db.exec("BEGIN");
      inTransaction = true;
      try {
        const result = await work(sql);
        db.exec("COMMIT");
        return result;
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      } finally {
        inTransaction = false;
      }
    },
  };
  return sql;
}
