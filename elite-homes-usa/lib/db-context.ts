import { AsyncLocalStorage } from 'node:async_hooks';

export type SqlValue = string | number | null;
export type Statement = { sql: string; args: SqlValue[] };
export interface Database {
  all<T>(sql: string, ...args: SqlValue[]): Promise<T[]>;
  run(sql: string, ...args: SqlValue[]): Promise<void>;
  batch(statements: Statement[]): Promise<void>;
}

export const requestDatabase = new AsyncLocalStorage<Database>();
