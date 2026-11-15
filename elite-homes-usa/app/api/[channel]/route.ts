import { z } from 'zod';
import { channels, schemas, submission } from '@/lib/schema';
import { clientKey, json, readJson, sameOrigin } from '@/lib/http';
import { digest, database, saveSubmission, throttle } from '@/lib/store';

export async function POST(request: Request, context: { params: Promise<{ channel: string }> }) {
  if (!sameOrigin(request)) return json({ error: 'Refresh the page and try again.' }, 403);
  const channel = z.enum([...channels, 'unsubscribe']).safeParse((await context.params).channel);
  if (!channel.success) return json({ error: 'This form could not be found.' }, 404);

  const body = await readJson(request);
  try {
    if (channel.data === 'unsubscribe') {
      const input = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).safeParse(body);
      if (!input.success) return json({ error: 'The unsubscribe link is incomplete.' }, 400);
      if (await throttle('unsubscribe:' + clientKey(request), 30)) return json({ error: 'Please try again in a few minutes.' }, 429);
      await database().run("UPDATE submissions SET active = 0 WHERE channel = 'newsletter' AND unsubscribe_key = ?", digest(input.data.token));
      return json({ success: true });
    }
    const input = submission.safeParse(body);
    if (!input.success || input.data.website) return json({ error: 'Please refresh the form and try again.' }, 400);
    const { data, requestId, source, utm } = input.data;
    const validated = schemas[channel.data].safeParse(data);
    if (!validated.success) return json({ error: 'Please check the highlighted fields.', fields: Object.fromEntries(validated.error.issues.map(issue => [String(issue.path[0]), [issue.message]])) }, 422);
    if (await throttle(channel.data + ':' + clientKey(request), 30)) return json({ error: 'Too many requests. Please try again in a few minutes.' }, 429);
    const saved = await saveSubmission(channel.data, requestId, validated.data, source, utm);
    if (!saved) return json({ error: 'Refresh the page to start a new request.' }, 409);
    return json({ success: true, ...saved }, 201);
  } catch {
    return json({ error: 'We couldn’t save your request. Your information is still here. Please try again.' }, 503);
  }
}
