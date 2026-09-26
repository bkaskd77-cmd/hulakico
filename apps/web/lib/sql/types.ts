export type RunResult = { changes: number; lastInsertRowid: number };

export interface SqlStatement {
  get(...params: unknown[]): Promise<unknown>;
  all(...params: unknown[]): Promise<unknown[]>;
  run(...params: unknown[]): Promise<RunResult>;
}

export interface Sql {
  prepare(sql: string): SqlStatement;
  exec(sql: string): Promise<void>;
  transaction<T>(work: (tx: Sql) => Promise<T>): Promise<T>;
}
