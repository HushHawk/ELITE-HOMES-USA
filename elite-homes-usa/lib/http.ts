export const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });

export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin || request.headers.get('sec-fetch-site') === 'cross-site') return false;
  try {
    const expected = new URL(process.env.ELITE_SITE_URL || request.url);
    const host = request.headers.get('host');
    if (!process.env.ELITE_SITE_URL && host) expected.host = host;
    return new URL(origin).origin === expected.origin;
  } catch { return false; }
}

export function clientKey(request: Request) {
  if (process.env.ELITE_TRUST_PROXY === '1') return (request.headers.get('cf-connecting-ip') || 'shared').slice(0, 64);
  return 'shared';
}

export async function readJson(request: Request, maximum = 12_000): Promise<unknown> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return null;
  const stream = request.body?.getReader();
  if (!stream) return null;
  const decoder = new TextDecoder();
  let value = '';
  let bytes = 0;
  try {
    for (;;) {
      const part = await stream.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > maximum) { await stream.cancel(); return null; }
      value += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(value + decoder.decode());
  } catch { return null; }
}
