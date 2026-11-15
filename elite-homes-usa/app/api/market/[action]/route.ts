import { clientKey, json, readJson, sameOrigin } from '@/lib/http';
import { isPreview, throttle } from '@/lib/store';
import { buyerInput, MAX_PHOTOS, MAX_PHOTO_BYTES, sellerInput, visitorReview } from '@/lib/market-schema';
import { existingRecord, saveMarketOffer, saveProperty, saveVisitorReview } from '@/lib/market-store';
import { cleanPhoto, limitedBody } from '@/lib/media';
import type { z } from 'zod';

function invalid(error: z.ZodError) {
  return json({ error: error.issues[0].message, field: error.issues[0].path[0] }, 422);
}
const success = (reference: string) => json({ success: true, reference, preview: isPreview() }, 201);

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  if (!sameOrigin(request)) return json({ error: 'Please reload the form and try again.' }, 403);
  const { action } = await params;
  if (!['sell', 'offer', 'review'].includes(action)) return json({ error: 'Form not found.' }, 404);
  try {
    if (await throttle('market:' + action + ':' + clientKey(request), action === 'sell' ? 12 : 30)) {
      return json({ error: 'Too many requests. Try again in a few minutes.' }, 429);
    }
    if (action === 'sell') {
      const type = request.headers.get('content-type');
      if (!type?.startsWith('multipart/form-data;')) return json({ error: 'Expected a property form with images.' }, 415);
      const body = await limitedBody(request, MAX_PHOTOS * MAX_PHOTO_BYTES + 100_000);
      if (!body) return json({ error: 'Your upload is too large. Reduce the file sizes and retry.' }, 413);
      let form: FormData;
      let details: unknown;
      try {
        form = await new Response(body.buffer as ArrayBuffer, { headers: { 'Content-Type': type } }).formData();
        details = JSON.parse(String(form.get('details')));
      } catch { return json({ error: 'The property form could not be read.' }, 400); }
      const parsed = sellerInput.safeParse(details);
      if (!parsed.success) return invalid(parsed.error);
      const { requestId, website, ...seller } = parsed.data;
      if (website) return json({ error: 'Please refresh and try again.' }, 400);
      const previous = await existingRecord('sell', requestId);
      if (previous) return success(previous);
      const files = form.getAll('photos');
      if (!files.length || files.length > MAX_PHOTOS) return json({ error: 'Add between one and eight property photos.', field: 'photos' }, 422);
      const photos = [];
      for (const file of files) {
        if (typeof file === 'string' || file.type !== 'image/webp' || file.size > MAX_PHOTO_BYTES) return json({ error: 'One of the photos is unsupported or too large.', field: 'photos' }, 422);
        const bytes = cleanPhoto(new Uint8Array(await file.arrayBuffer()));
        if (!bytes) return json({ error: 'One of the photos is invalid. Choose a different photo.', field: 'photos' }, 422);
        photos.push({ bytes, mime: 'image/webp' });
      }
      return success(await saveProperty(seller, requestId, photos));
    }
    const body = await readJson(request, 9000);
    if (action === 'offer') {
      const parsed = buyerInput.safeParse(body);
      if (!parsed.success) return invalid(parsed.error);
      const { requestId, listing, website, ...details } = parsed.data;
      if (website) return json({ error: 'Please refresh and try again.' }, 400);
      const id = await saveMarketOffer(details, listing, requestId);
      return id ? success(id) : json({ error: 'This property is no longer accepting cash offers.' }, 409);
    }
    const parsed = visitorReview.safeParse(body);
    if (!parsed.success) return invalid(parsed.error);
    const { requestId, website, permission, ...details } = parsed.data;
    if (website || !permission) return json({ error: 'Please refresh and try again.' }, 400);
    const id = await saveVisitorReview(details, requestId);
    return id ? success(id) : json({ error: 'Refresh the form and try again.' }, 409);
  } catch {
    return json({ error: 'We couldn’t save your information. You can retry without entering it again.' }, 503);
  }
}
