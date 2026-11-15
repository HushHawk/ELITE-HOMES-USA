import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Database } from './db-context.ts';

let connection: Database | undefined;

export function localDatabase(): Database {
  if (connection) return connection;
  const path = resolve(/* turbopackIgnore: true */ process.env.ELITE_DATA_PATH || '.data/elite.sqlite');
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  for (const migration of ['0000_inbox.sql', '0001_marketplace.sql']) {
    db.exec(readFileSync(join(process.cwd(), 'drizzle', migration), 'utf8'));
  }
  connection = {
    async all(sql, ...args) { return db.prepare(sql).all(...args) as never[]; },
    async run(sql, ...args) { db.prepare(sql).run(...args); },
    async batch(statements) {
      db.exec('BEGIN IMMEDIATE');
      try {
        for (const { sql, args } of statements) db.prepare(sql).run(...args);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
  };
  return connection;
}
