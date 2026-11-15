import type { Database } from '../lib/db-context.ts';

export function localDatabase(): Database {
  throw new Error('The Sites D1 binding is unavailable.');
}
