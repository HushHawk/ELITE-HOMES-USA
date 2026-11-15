import { z } from 'zod';
import { canManage } from '@/lib/admin-auth';
import { json, readJson, sameOrigin } from '@/lib/http';
import { contentInput, offerChange, propertyChange, reviewChange } from '@/lib/market-schema';
import { adminMarket, updateMarketOffer, updateProperty, updateSiteContent, updateSiteReview } from '@/lib/market-store';

export async function GET() {
  if (!await canManage()) return json({ error: 'Sign in to view the marketplace.' }, 401);
  try { return json(await adminMarket()); }
  catch { return json({ error: 'The marketplace dashboard is unavailable.' }, 503); }
}

const mutation = z.discriminatedUnion('action', [
  z.object({ action: z.literal('property'), change: propertyChange }),
  z.object({ action: z.literal('offer'), change: offerChange }),
  z.object({ action: z.literal('review'), change: reviewChange }),
  z.object({ action: z.literal('content'), change: contentInput, revision: z.number().int().min(0) }),
]);

export async function PATCH(request: Request) {
  if (!await canManage()) return json({ error: 'Sign in to update the marketplace.' }, 401);
  if (!sameOrigin(request)) return json({ error: 'Invalid request origin.' }, 403);
  const parsed = mutation.safeParse(await readJson(request, 24_000));
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return json({ error: [issue.path.slice(1).join(' '), issue.message].filter(Boolean).join('. ') }, 422);
  }
  try {
    const input = parsed.data;
    let error;
    switch (input.action) {
      case 'property': error = await updateProperty(input.change); break;
      case 'offer': error = await updateMarketOffer(input.change); break;
      case 'review': error = await updateSiteReview(input.change); break;
      case 'content': error = await updateSiteContent(input.change, input.revision);
    }
    return error ? json({ error }, 409) : json({ success: true });
  } catch { return json({ error: 'The change could not be saved.' }, 503); }
}
