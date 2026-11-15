import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { Database } from './db-context.ts';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  channel TEXT NOT NULL,
  payload TEXT NOT NULL,
  source TEXT NOT NULL,
  preview INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'New',
  follow_up TEXT NOT NULL DEFAULT '',
  email_key TEXT,
  unsubscribe_key TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS submissions_channel_date ON submissions(channel, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_unique ON submissions(preview, email_key) WHERE channel = 'newsletter' AND active = 1;
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  status TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS activity_time ON activities(submission_id, created_at DESC);
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  hits INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS market_properties (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  preview INTEGER NOT NULL,
  seller_json TEXT NOT NULL,
  public_json TEXT NOT NULL DEFAULT '{}',
  public_photos TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'Submitted',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS market_listing_status ON market_properties(preview, status, updated_at DESC);
CREATE TABLE IF NOT EXISTS market_offers (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE,
  property_id TEXT NOT NULL REFERENCES market_properties(id),
  preview INTEGER NOT NULL,
  offer_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Received',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS market_offer_date ON market_offers(preview, created_at DESC);
CREATE TABLE IF NOT EXISTS market_media (
  id TEXT PRIMARY KEY,
  preview INTEGER NOT NULL,
  property_id TEXT REFERENCES market_properties(id),
  mime TEXT NOT NULL,
  bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS market_media_property ON market_media(property_id);
CREATE TABLE IF NOT EXISTS market_events (
  id TEXT PRIMARY KEY,
  record_id TEXT NOT NULL,
  note TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS market_event_record ON market_events(record_id, created_at DESC);
CREATE TABLE IF NOT EXISTS site_content (
  preview INTEGER PRIMARY KEY,
  content_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS site_reviews (
  id TEXT PRIMARY KEY,
  request_id TEXT UNIQUE,
  preview INTEGER NOT NULL,
  review_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pending',
  created_at TEXT NOT NULL
);
`;

let connection: Database | undefined;

export function localDatabase(): Database {
  if (connection) return connection;
  const defaultPath = process.env.VERCEL ? '/tmp/elite.sqlite' : '.data/elite.sqlite';
  const path = resolve(/* turbopackIgnore: true */ process.env.ELITE_DATA_PATH || defaultPath);
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000; PRAGMA foreign_keys = ON;');
  try {
    for (const migration of ['0000_inbox.sql', '0001_marketplace.sql']) {
      db.exec(readFileSync(join(process.cwd(), 'drizzle', migration), 'utf8'));
    }
  } catch {
    db.exec(SCHEMA_SQL);
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
