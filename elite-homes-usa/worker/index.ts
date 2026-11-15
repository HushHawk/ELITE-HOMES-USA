import type { D1Database, ExecutionContext, R2Bucket } from '@cloudflare/workers-types';
import { requestMedia, type MediaDriver } from '../lib/media-context.ts';
import handler from 'vinext/server/fetch-handler';
import { requestDatabase, type Database, type SqlValue } from '../lib/db-context.ts';

const worker = {
  fetch(request: Request, env: { DB: D1Database; BUCKET: R2Bucket }, context: ExecutionContext) {
    const database: Database = {
      async all<T>(sql: string, ...args: SqlValue[]): Promise<T[]> {
        return (await env.DB.prepare(sql).bind(...args).all<T>()).results;
      },
      async run(sql, ...args) { await env.DB.prepare(sql).bind(...args).run(); },
      async batch(statements) { await env.DB.batch(statements.map(({ sql, args }) => env.DB.prepare(sql).bind(...args))); },
    };
    const media: MediaDriver = {
      async put(id, bytes) { await env.BUCKET.put(id, bytes); },
      async get(id, range) { return (await env.BUCKET.get(id, range ? { range } : undefined))?.body as ReadableStream | undefined ?? null; },
      async remove(id) { await env.BUCKET.delete(id); },
    };
    return requestDatabase.run(database, () => requestMedia.run(media, () => handler.fetch(request, env, context)));
  },
};

export default worker;
