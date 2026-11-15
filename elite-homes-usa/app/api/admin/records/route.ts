import { cookies } from 'next/headers';
import { z } from 'zod';
import { json, readJson, sameOrigin } from '@/lib/http';
import { cookieName, validSession } from '@/lib/session';
import { channels, recordUpdate } from '@/lib/schema';
import { database, isPreview, listRecords, updateRecord } from '@/lib/store';

async function authorized() {
  return validSession((await cookies()).get(cookieName)?.value);
}

export async function GET(request: Request) {
  if (!await authorized()) return json({ error: 'Sign in to view the inbox.' }, 401);
  const params = new URL(request.url).searchParams;
  const channel = z.enum(channels).safeParse(params.get('channel') || 'offer');
  const page = Math.min(1000, Math.max(1, parseInt(params.get('page') || '', 10) || 1));
  const status = (params.get('status') || '').slice(0, 40);
  if (!channel.success) return json({ error: 'Invalid inbox.' }, 400);
  try {
    const rows = await listRecords(channel.data, (params.get('query') || '').slice(0, 120), status, page);
    const totals = await database().all<{ status: string; total: number }>(
      'SELECT status, count(*) as total FROM submissions WHERE channel = ? AND preview = ? GROUP BY status', channel.data, Number(isPreview())
    );
    if (params.get('id')) {
      const record = z.uuid().safeParse(params.get('id'));
      if (!record.success) return json({ error: 'Invalid record.' }, 400);
      const history = await database().all('SELECT a.status, a.note, a.created_at FROM activities a JOIN submissions s ON s.id = a.submission_id WHERE a.submission_id = ? AND s.preview = ? ORDER BY a.created_at DESC LIMIT 100', record.data, Number(isPreview()));
      return json({ history });
    }
    return json({ records: rows.slice(0, 20), hasNext: rows.length > 20, totals });
  } catch { return json({ error: 'The inbox is temporarily unavailable.' }, 503); }
}

export async function PATCH(request: Request) {
  if (!await authorized()) return json({ error: 'Sign in to update a record.' }, 401);
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  const input = recordUpdate.safeParse(await readJson(request));
  if (!input.success) return json({ error: 'Check the status, note and follow-up date.' }, 422);
  try {
    const record = input.data;
    const [existing] = await database().all("SELECT id FROM submissions WHERE id = ? AND preview = ? AND channel != 'newsletter'", record.id, Number(isPreview()));
    if (!existing) return json({ error: 'Record not found.' }, 404);
    await updateRecord(record.id, record.status, record.note, record.followUp);
    return json({ success: true });
  } catch { return json({ error: 'The change could not be saved.' }, 503); }
}
