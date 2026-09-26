import type { Client, InArgs, InStatement, ResultSet } from "@libsql/client/web";
import type { Sql } from "@/lib/sql/types";

type Executor = {
  execute(statement: InStatement): Promise<ResultSet>;
  executeMultiple(sql: string): Promise<void>;
};

function toArgs(params: unknown[]): InArgs {
  return params.map((value) =>
    typeof value === "number" && Number.isInteger(value) ? BigInt(value) : value,
  ) as InArgs;
}

function toRows(result: ResultSet): Record<string, unknown>[] {
  return result.rows.map((row) =>
    Object.fromEntries(result.columns.map((column, index) => [column, row[index]])),
  );
}

export function createRemoteSql(executor: Executor, client: Client | null): Sql {
  const sql: Sql = {
    prepare(text) {
      const execute = (params: unknown[]) =>
        executor.execute({ sql: text, args: toArgs(params) });
      return {
        async get(...params) {
          return toRows(await execute(params))[0];
        },
        async all(...params) {
          return toRows(await execute(params));
        },
        async run(...params) {
          const result = await execute(params);
          return {
            changes: result.rowsAffected,
            lastInsertRowid: Number(result.lastInsertRowid ?? 0),
          };
        },
      };
    },
    async exec(text) {
      await executor.executeMultiple(text);
    },
    async transaction(work) {
      if (!client) return work(sql);
      const tx = await client.transaction("write");
      try {
        const result = await work(createRemoteSql(tx, null));
        await tx.commit();
        return result;
      } catch (error) {
        await tx.rollback();
        throw error;
      } finally {
        tx.close();
      }
    },
  };
  return sql;
}
