import { randomUUID } from 'node:crypto';
import { database, isPreview, type InboxRow } from './store.ts';
import { mediaStore } from './media.ts';
import { contentInput, defaultContent, videoSource, type SiteContent, type SellerDetails, type PublicListing, type BuyerDetails, type ReviewDetails, type propertyChange, type offerChange, type reviewChange } from './market-schema.ts';
import { sellerReviews } from './content.ts';
import type { z } from 'zod';

export type PropertyRecord = { id: string; seller_json: string; public_json: string; public_photos: string; status: string; created_at: string; updated_at: string };
export type OfferRecord = { id: string; property_id: string; offer_json: string; title: string; status: string; created_at: string };
export type MediaRecord = { id: string; mime: string; bytes: number; property_id: string | null; created_at: string };
export type ReviewRecord = { id: string; review_json: string; status: string; created_at: string };
export type MarketEvent = { record_id: string; status: string; note: string; created_at: string };
export type InquiriesSummary = {
  total: number;
  offers: number;
  contact: number;
  newsletter: number;
  recent: InboxRow[];
};
type FileData = { bytes: Uint8Array; mime: string };

const mode = () => Number(isPreview());
const now = () => new Date().toISOString();

export async function seedDefaultReviewsIfNeeded() {
  const db = database();
  const [row] = await db.all<{ c: number }>('SELECT count(*) as c FROM site_reviews WHERE preview = ?', mode());
  if (!row || row.c === 0) {
    const time = now();
    for (const rev of sellerReviews) {
      await db.run(
        'INSERT INTO site_reviews (id, request_id, preview, review_json, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        randomUUID(), randomUUID(), mode(), JSON.stringify({ name: rev.name, title: rev.title, body: rev.detail }), 'Published', time
      );
    }
  }
}

export async function siteContent() {
  const [row] = await database().all<{ content_json: string; revision: number }>('SELECT content_json, revision FROM site_content WHERE preview = ?', mode());
  return { content: row ? contentInput.parse(JSON.parse(row.content_json)) : defaultContent, revision: row?.revision ?? 0 };
}

export async function publicListings(id = '') {
  const rows = await database().all<{ id: string; public_json: string; public_photos: string; status: string }>(
    "SELECT id, public_json, public_photos, status FROM market_properties WHERE preview = ? AND status IN ('Published','Under contract') AND (? = '' OR id = ?) ORDER BY updated_at DESC LIMIT 100",
    mode(), id, id,
  );
  return rows.map(row => ({ id: row.id, status: row.status, ...JSON.parse(row.public_json) as PublicListing, photos: JSON.parse(row.public_photos) as string[] }));
}

export async function publishedReviews() {
  await seedDefaultReviewsIfNeeded();
  const rows = await database().all<ReviewRecord>("SELECT id, review_json, status, created_at FROM site_reviews WHERE preview = ? AND status = 'Published' ORDER BY created_at DESC LIMIT 40", mode());
  return rows.map(row => {
    const { name, title, body } = JSON.parse(row.review_json) as ReviewDetails;
    return { name, title, detail: body };
  });
}

export async function existingRecord(kind: 'sell' | 'offer' | 'review', requestId: string) {
  const table = { sell: 'market_properties', offer: 'market_offers', review: 'site_reviews' }[kind];
  const [row] = await database().all<{ id: string }>('SELECT id FROM ' + table + ' WHERE preview = ? AND request_id = ?', mode(), requestId);
  return row?.id;
}

export async function saveProperty(details: SellerDetails, requestId: string, photos: FileData[]) {
  const store = mediaStore();
  const id = randomUUID();
  const created = now();
  const attachments = [];
  try {
    for (const file of photos) {
      const media = { id: randomUUID(), ...file };
      await store.put(media.id, media.bytes);
      attachments.push(media);
    }
    await database().batch([
      { sql: 'INSERT INTO market_properties (id, request_id, preview, seller_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', args:[id, requestId, mode(), JSON.stringify(details), created, created] },
      ...attachments.map(file => ({
        sql:'INSERT INTO market_media (id, preview, property_id, mime, bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args:[file.id, mode(), id, file.mime, file.bytes.length, created],
      })),
    ]);
    return id;
  } catch (failure) {
    const saved = await existingRecord('sell', requestId);
    if (saved !== id) await Promise.allSettled(attachments.map(file => store.remove(file.id)));
    if (saved) return saved;
    throw failure;
  }
}

export async function saveMarketOffer(details: BuyerDetails, listing: string, requestId: string) {
  const [saved] = await database().all<{ id: string }>(
    "INSERT INTO market_offers (id, request_id, property_id, preview, offer_json, created_at) SELECT ?, ?, id, preview, ?, ? FROM market_properties WHERE id = ? AND preview = ? AND status = 'Published' ON CONFLICT DO NOTHING RETURNING id",
    randomUUID(), requestId, JSON.stringify(details), now(), listing, mode(),
  );
  return saved?.id ?? await existingRecord('offer', requestId);
}

export async function saveVisitorReview(details: ReviewDetails, requestId: string) {
  const [saved] = await database().all<{ id: string }>('INSERT INTO site_reviews (id, request_id, preview, review_json, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING RETURNING id', randomUUID(), requestId, mode(), JSON.stringify(details), now());
  return saved?.id ?? await existingRecord('review', requestId);
}

export async function adminMarket() {
  await seedDefaultReviewsIfNeeded();
  const db = database();
  const [properties, offers, media, reviews, events, site, inquiries] = await Promise.all([
    db.all<PropertyRecord>('SELECT id, seller_json, public_json, public_photos, status, created_at, updated_at FROM market_properties WHERE preview = ? ORDER BY updated_at DESC LIMIT 150', mode()),
    db.all<OfferRecord>("SELECT o.id, o.property_id, o.offer_json, o.status, o.created_at, coalesce(json_extract(p.public_json, '$.title'), 'Property') AS title FROM market_offers o JOIN market_properties p ON p.id = o.property_id WHERE o.preview = ? ORDER BY o.created_at DESC LIMIT 150", mode()),
    db.all<MediaRecord>('SELECT id, mime, bytes, property_id, created_at FROM market_media WHERE preview = ? ORDER BY created_at DESC LIMIT 1600', mode()),
    db.all<ReviewRecord>('SELECT id, review_json, status, created_at FROM site_reviews WHERE preview = ? ORDER BY created_at DESC LIMIT 100', mode()),
    db.all<MarketEvent>('SELECT record_id, status, note, created_at FROM market_events WHERE record_id IN (SELECT id FROM market_properties WHERE preview = ? UNION SELECT id FROM market_offers WHERE preview = ?) ORDER BY created_at DESC LIMIT 240', mode(), mode()),
    siteContent(),
    db.all<InboxRow>('SELECT id, channel, payload, source, preview, status, follow_up, active, created_at FROM submissions WHERE preview = ? ORDER BY created_at DESC LIMIT 50', mode()),
  ]);
  const inquiriesSummary: InquiriesSummary = {
    total: inquiries.length,
    offers: inquiries.filter(i => i.channel === 'offer').length,
    contact: inquiries.filter(i => i.channel === 'contact').length,
    newsletter: inquiries.filter(i => i.channel === 'newsletter').length,
    recent: inquiries.slice(0, 10),
  };
  return { properties, offers, media, reviews, events, site, inquiries: inquiriesSummary };
}

export async function updateProperty(change: z.infer<typeof propertyChange>) {
  const db = database();
  const [record] = await db.all<{ id: string }>('SELECT id FROM market_properties WHERE id = ? AND preview = ?', change.id, mode());
  if (!record) return 'Property not found.';
  const visible = ['Published', 'Under contract'].includes(change.status);
  if (visible && (!change.listing || !change.photos.length || !change.publicationPermission)) return 'Add the public listing details, choose photos and confirm publishing permission.';
  const permitted = await db.all<{ id: string }>('SELECT id FROM market_media WHERE property_id = ? AND preview = ?', change.id, mode());
  if (change.photos.some(id => !permitted.some(row => row.id === id))) return 'Select photos uploaded for this property.';
  const time = now();
  await db.batch([
    { sql:'UPDATE market_properties SET status = ?, public_json = coalesce(?, public_json), public_photos = ?, updated_at = ? WHERE id = ? AND preview = ?', args:[change.status, change.listing ? JSON.stringify(change.listing) : null, JSON.stringify([...new Set(change.photos)]), time, change.id, mode()] },
    { sql:'INSERT INTO market_events (id, record_id, note, status, created_at) VALUES (?, ?, ?, ?, ?)', args:[randomUUID(), change.id, change.note, change.status, time] },
  ]);
}

export async function updateMarketOffer(change: z.infer<typeof offerChange>) {
  const db = database();
  const [record] = await db.all<{ id: string }>('SELECT id FROM market_offers WHERE id = ? AND preview = ?', change.id, mode());
  if (!record) return 'Offer not found.';
  await db.batch([
    { sql:'UPDATE market_offers SET status = ? WHERE id = ? AND preview = ?', args:[change.status, change.id, mode()] },
    { sql:'INSERT INTO market_events (id, record_id, note, status, created_at) VALUES (?, ?, ?, ?, ?)', args:[randomUUID(), change.id, change.note, change.status, now()] },
  ]);
}

export async function updateSiteReview(change: z.infer<typeof reviewChange>) {
  const db = database();
  const review = { name: change.name, title: change.title, body: change.body };
  if (change.id) {
    const [row] = await db.all<ReviewRecord>('SELECT id, review_json, status, created_at FROM site_reviews WHERE id = ? AND preview = ?', change.id, mode());
    if (!row) return 'Review not found.';
    if (change.remove) await db.run('DELETE FROM site_reviews WHERE id = ? AND preview = ?', change.id, mode());
    else await db.run('UPDATE site_reviews SET review_json = ?, status = ? WHERE id = ? AND preview = ?', JSON.stringify({ ...JSON.parse(row.review_json), ...review }), change.status, change.id, mode());
  } else {
    await db.run('INSERT INTO site_reviews (id, preview, review_json, status, created_at) VALUES (?, ?, ?, ?, ?)', randomUUID(), mode(), JSON.stringify(review), change.status, now());
  }
}

export async function addSiteMedia(file: FileData, propertyId?: string) {
  const id = randomUUID();
  await mediaStore().put(id, file.bytes);
  const db = database();
  if (!propertyId) {
    await db.run('INSERT INTO market_media (id, preview, mime, bytes, created_at) VALUES (?, ?, ?, ?, ?)', id, mode(), file.mime, file.bytes.length, now());
    return id;
  }
  const [saved] = await db.all(
    'INSERT INTO market_media (id, preview, property_id, mime, bytes, created_at) SELECT ?, preview, id, ?, ?, ? FROM market_properties WHERE id = ? AND preview = ? AND (SELECT count(*) FROM market_media WHERE property_id = ?) < 24 RETURNING id',
    id, file.mime, file.bytes.length, now(), propertyId, mode(), propertyId,
  );
  if (!saved) await mediaStore().remove(id);
  return saved ? id : undefined;
}

export async function updateSiteContent(content: SiteContent, revision: number) {
  const db = database();
  const ids = [...new Set([...content.heroImages, ...content.gallery].map(image => image.id).concat(content.video.kind === 'upload' ? [content.video.id] : []))];
  if (content.video.kind === 'url' && !videoSource(content.video.url)) return 'Enter an HTTPS MP4, WebM, YouTube or Vimeo URL.';
  const media = ids.length ? await db.all<{ id: string; mime: string }>('SELECT id, mime FROM market_media WHERE property_id IS NULL AND preview = ? AND id IN (' + ids.map(() => '?').join(',') + ')', mode(), ...ids) : [];
  if ([...content.heroImages, ...content.gallery].some(image => !media.some(file => file.id === image.id && file.mime === 'image/webp'))) return 'Choose uploaded image files for the gallery and slider.';
  if (content.video.kind === 'upload' && !media.some(file => file.id === (content.video.kind === 'upload' && content.video.id) && file.mime.startsWith('video/'))) return 'Choose an uploaded video.';
  const [saved] = revision === 0
    ? await db.all('INSERT INTO site_content (preview, content_json) VALUES (?, ?) ON CONFLICT DO NOTHING RETURNING revision', mode(), JSON.stringify(content))
    : await db.all('UPDATE site_content SET content_json = ?, revision = revision + 1 WHERE preview = ? AND revision = ? RETURNING revision', JSON.stringify(content), mode(), revision);
  return saved ? undefined : 'Another edit was published. Reload the dashboard to review the latest content.';
}

export async function mediaAccess(id: string, admin: boolean) {
  const db = database();
  const [file] = await db.all<MediaRecord>('SELECT id, mime, bytes, property_id, created_at FROM market_media WHERE id = ? AND preview = ?', id, mode());
  if (!file) return;
  if (admin) return file;
  if (file.property_id) {
    const [visible] = await db.all("SELECT 1 FROM market_properties p, json_each(p.public_photos) j WHERE p.id = ? AND p.preview = ? AND p.status IN ('Published','Under contract') AND j.value = ?", file.property_id, mode(), id);
    return visible ? file : undefined;
  }
  const { content } = await siteContent();
  const visible = [...content.heroImages, ...content.gallery].some(item => item.id === id) || (content.video.kind === 'upload' && content.video.id === id);
  return visible ? file : undefined;
}
