import { cookies } from 'next/headers';
import { z } from 'zod';
import { clientKey, json, readJson, sameOrigin } from '@/lib/http';
import { adminEnabled, authorizedSecret, cookieName, issueSession, sessionSeconds } from '@/lib/session';
import { throttle } from '@/lib/store';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  if (!adminEnabled()) return json({ error: 'The owner inbox is awaiting configuration.' }, 503);
  const input = z.object({ secret: z.string().max(512) }).safeParse(await readJson(request));
  try {
    if (await throttle('admin:' + clientKey(request), 8, 900)) return json({ error: 'Too many attempts. Try again later.' }, 429);
  } catch { return json({ error: 'The owner inbox is temporarily unavailable.' }, 503); }
  if (!input.success || !authorizedSecret(input.data.secret)) return json({ error: 'Sign-in failed.' }, 401);
  const jar = await cookies();
  jar.set(cookieName, issueSession(), { httpOnly: true, secure: new URL(process.env.ELITE_SITE_URL || request.url).protocol === 'https:', sameSite: 'strict', maxAge: sessionSeconds, path: '/' });
  return json({ success: true });
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  (await cookies()).delete(cookieName);
  return json({ success: true });
}
