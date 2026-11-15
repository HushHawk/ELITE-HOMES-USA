import { z } from 'zod';
import { canManage } from '@/lib/admin-auth';
import { json, sameOrigin } from '@/lib/http';
import { MAX_PHOTO_BYTES, MAX_VIDEO_BYTES } from '@/lib/market-schema';
import { addSiteMedia } from '@/lib/market-store';
import { cleanPhoto, limitedBody, videoMime } from '@/lib/media';

export async function POST(request: Request) {
  if (!await canManage()) return json({ error: 'Sign in to upload files.' }, 401);
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  const type = request.headers.get('content-type') || '';
  const image = type === 'image/webp';
  const propertyId = new URL(request.url).searchParams.get('property') || undefined;
  if (propertyId && (!z.uuid().safeParse(propertyId).success || !image)) return json({ error: 'Select a property and an image file.' }, 422);
  if (!image && !['video/mp4', 'video/webm'].includes(type)) return json({ error: 'Choose a photo, MP4 or WebM file.' }, 415);
  try {
    const file = await limitedBody(request, image ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES);
    if (!file?.length) return json({ error: 'The file is missing or exceeds the size limit.' }, 413);
    const bytes = image ? cleanPhoto(file) : file;
    const mime = image ? type : videoMime(file, type);
    if (!mime || !bytes) return json({ error: 'The file data could not be recognized.' }, 422);
    const id = await addSiteMedia({ bytes, mime }, propertyId);
    if (!id) return json({ error: 'The property was not found or its private photo library is full.' }, 409);
    return json({ id, mime, bytes: bytes.length, property_id: propertyId || null, created_at: new Date().toISOString() }, 201);
  } catch { return json({ error: 'The file could not be saved.' }, 503); }
}
