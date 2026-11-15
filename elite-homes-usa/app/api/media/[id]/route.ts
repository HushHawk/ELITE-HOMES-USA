import { z } from 'zod';
import { canManage } from '@/lib/admin-auth';
import { mediaAccess } from '@/lib/market-store';
import { mediaStore } from '@/lib/media';

const notFound = () => new Response(null, { status: 404, headers: { 'Cache-Control': 'no-store' } });

async function serve(request: Request, params: Promise<{ id: string }>, head = false) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) return notFound();
  try {
    const file = await mediaAccess(id, await canManage());
    if (!file) return notFound();
    const headers = new Headers({
      'Content-Type': file.mime,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Accept-Ranges': 'bytes',
    });
    const range = request.headers.get('range');
    if (range) {
      const match = range.match(/^bytes=(\d*)-(\d*)$/);
      const start = match?.[1] ? Number(match[1]) : Math.max(0, file.bytes - Number(match?.[2]));
      const end = match?.[1] && match[2] ? Math.min(Number(match[2]), file.bytes - 1) : file.bytes - 1;
      if (!match || (!match[1] && !match[2]) || !Number.isSafeInteger(start) || start > end || start >= file.bytes) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + file.bytes } });
      const length = end - start + 1;
      headers.set('Content-Range', `bytes ${start}-${end}/${file.bytes}`);
      headers.set('Content-Length', String(length));
      const body = head ? null : await mediaStore().get(id, { offset: start, length });
      return body || head ? new Response(body, { status: 206, headers }) : notFound();
    }
    headers.set('Content-Length', String(file.bytes));
    const body = head ? null : await mediaStore().get(id);
    return body || head ? new Response(body, { status: 200, headers }) : notFound();
  } catch { return new Response(null, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
}

export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return serve(request, context.params);
}

export function HEAD(request: Request, context: { params: Promise<{ id: string }> }) {
  return serve(request, context.params, true);
}
