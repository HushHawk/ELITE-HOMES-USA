import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { requestDatabase } from './db-context.ts';
import { localDatabase } from './local-db.ts';
import { newsletterDisclosure, newsletterVersion, type Channel } from './schema.ts';

export function database() {
  return requestDatabase.getStore() ?? localDatabase();
}

export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export const isPreview = () => process.env.ELITE_MODE !== 'live';

export async function throttle(key: string, maximum: number, seconds = 600) {
  const now = Math.floor(Date.now() / 1000);
  const db = database();
  await db.run('DELETE FROM rate_limits WHERE expires_at <= ?', now);
  const [record] = await db.all<{ hits: number }>(
    'INSERT INTO rate_limits (key, hits, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET hits = hits + 1 RETURNING hits',
    digest(key), now + seconds
  );
  return record.hits > maximum;
}

type StoredId = { id: string; preview: number; unsubscribe_key?: string };

export async function saveSubmission(channel: Channel, requestId: string, data: Record<string, unknown>, source: string, utm?: Record<string, string>) {
  const db = database();
  const id = randomUUID();
  const preview = Number(isPreview());
  const time = new Date().toISOString();
  const isNewsletter = channel === 'newsletter';
  const emailKey = isNewsletter ? digest(String(data.email)) : null;
  const unsubscribeToken = isNewsletter ? randomBytes(32).toString('base64url') : null;
  const unsubscribeKey = unsubscribeToken ? digest(unsubscribeToken) : null;
  const payload = { ...data, ...(utm && { utm }), ...(isNewsletter && { consentVersion: newsletterVersion, disclosure: newsletterDisclosure, consentAt: time }) };
  const [insert] = await db.all<StoredId>(
    'INSERT INTO submissions (id, request_id, channel, payload, source, preview, email_key, unsubscribe_key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING id, preview',
    id, requestId, channel, JSON.stringify(payload), source, preview, emailKey, unsubscribeKey, time
  );
  if (insert) return { reference: insert.id, preview: Boolean(insert.preview), ...(unsubscribeToken && { unsubscribeToken }) };
  const [existing] = await db.all<StoredId>('SELECT id, preview FROM submissions WHERE request_id = ? AND channel = ? AND preview = ?', requestId, channel, preview);
  if (existing) return { reference: existing.id, preview: Boolean(existing.preview) };
  if (isNewsletter) return { preview: Boolean(preview) };
  return null;
}

export type InboxRow = { id: string; channel: Channel; payload: string; source: string; preview: number; status: string; follow_up: string; active: number; created_at: string };
export type Activity = { status: string; note: string; created_at: string };

export async function listRecords(channel: Channel, search: string, status: string, page: number) {
  return database().all<InboxRow>(
    "SELECT id, channel, payload, source, preview, status, follow_up, active, created_at FROM submissions WHERE channel = ? AND preview = ? AND (? = '' OR instr(lower(payload), lower(?)) > 0) AND (? = '' OR status = ?) ORDER BY created_at DESC, id LIMIT 21 OFFSET ?",
    channel, Number(isPreview()), search, search, status, status, (page - 1) * 20
  );
}

export async function updateRecord(id: string, status: string, note: string, followUp: string) {
  const time = new Date().toISOString();
  const preview = Number(isPreview());
  await database().batch([
    { sql: "UPDATE submissions SET status = ?, follow_up = ? WHERE id = ? AND preview = ? AND channel != 'newsletter'", args: [status, followUp, id, preview] },
    { sql: "INSERT INTO activities (id, submission_id, status, note, created_at) SELECT ?, id, ?, ?, ? FROM submissions WHERE id = ? AND preview = ? AND channel != 'newsletter'", args: [randomUUID(), status, note, time, id, preview] },
  ]);
}
