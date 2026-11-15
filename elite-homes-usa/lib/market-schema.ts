import { z } from 'zod';
import { propertyTypes } from './schema.ts';

const text = (max: number) => z.string().trim().min(1, 'This field is required.').max(max);
const optional = (max: number) => z.string().trim().max(max).default('');
const phone = z.string().trim().max(25).refine(value => /^\+?[\d ().-]+$/.test(value) && /^1?\d{10}$/.test(value.replace(/\D/g, '')), 'Enter a valid US phone number.');
const email = z.email().max(254).toLowerCase();
const state = z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'Use a two-letter state code.');
const money = z.number().int().min(1).max(100_000_000);
const emptyMoney = z.union([money, z.null()]);
export const marketPropertyTypes = [...propertyTypes, 'Development project'] as const;
const propertyType = z.enum(marketPropertyTypes);
const details = {
  city: text(90), state, propertyType,
  bedrooms: z.number().int().min(0).max(99).nullable(),
  bathrooms: z.number().min(0).max(99).multipleOf(.5).nullable(),
  area: z.number().int().min(1).max(1_000_000).nullable(),
};

export const sellerInput = z.object({
  ...details, requestId: z.uuid(), website: optional(200), address: text(180),
  zip: z.string().trim().regex(/^\d{5}(?:-\d{4})?$/, 'Enter a valid ZIP code.'),
  description: text(3500), asking: emptyMoney,
  name: text(100), email, phone,
  photoPermission: z.literal(true, { error: 'Confirm you have permission to share these materials.' }),
});

export const buyerInput = z.object({
  requestId: z.uuid(), website: optional(200), listing: z.uuid(), amount: money,
  name: text(100), email, phone, timeline: optional(100), terms: optional(1800),
});

export const propertyStatuses = ['Submitted', 'In review', 'Needs details', 'Published', 'Under contract', 'Sold', 'Rejected', 'Archived'] as const;
export const offerStatuses = ['Received', 'In review', 'Contacted', 'Accepted for discussion', 'Declined', 'Withdrawn', 'Closed'] as const;
export const reviewStatuses = ['Pending', 'Published', 'Hidden'] as const;
export const publicListingInput = z.object({
  ...details, title: text(110), description: text(3500), asking: emptyMoney, publicAddress: optional(180),
});
export const propertyChange = z.object({ id: z.uuid(), status: z.enum(propertyStatuses), listing: publicListingInput.nullable(), photos: z.array(z.uuid()).max(8), note: optional(1500), publicationPermission: z.boolean() });
export const offerChange = z.object({ id: z.uuid(), status: z.enum(offerStatuses), note: optional(1500) });
export const reviewContent = z.object({ name: text(80), title: text(105), body: text(1500) });
export const visitorReview = reviewContent.extend({
  requestId: z.uuid(), website: optional(200), email, permission: z.literal(true, { error: 'Confirm that we may publish your name and review.' }),
});
export const reviewChange = reviewContent.extend({ id: z.uuid().optional(), status: z.enum(reviewStatuses), remove: z.boolean().optional() });

export const contentInput = z.object({
  headline: z.string().trim().max(52), accent: z.string().trim().max(52), heroCopy: z.string().trim().max(250),
  introductionTitle: z.string().trim().max(100), introduction: z.string().trim().max(650),
  closingTitle: z.string().trim().max(100), closingCopy: z.string().trim().max(280),
  showOriginalReviews: z.boolean().default(true),
  heroImages: z.array(z.object({ id: z.uuid(), alt: text(140) })).max(5),
  gallery: z.array(z.object({ id: z.uuid(), alt: text(140) })).max(20),
  video: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('default') }),
    z.object({ kind: z.literal('off') }),
    z.object({ kind: z.literal('upload'), id: z.uuid() }),
    z.object({ kind: z.literal('url'), url: z.url({ protocol: /^https$/ }).max(1600) }),
  ]),
});
export const defaultContent: SiteContent = {
  headline:'', accent:'', heroCopy:'', introductionTitle:'', introduction:'', closingTitle:'', closingCopy:'',
  showOriginalReviews:true, heroImages:[], gallery:[], video:{kind:'default'},
};
export type SiteContent = z.infer<typeof contentInput>;
export type PublicListing = z.infer<typeof publicListingInput>;
export type SellerDetails = Omit<z.infer<typeof sellerInput>, 'requestId'|'website'>;
export type BuyerDetails = Omit<z.infer<typeof buyerInput>, 'requestId'|'website'|'listing'>;
export type ReviewDetails = z.infer<typeof reviewContent> & { email?: string };

export const MAX_PHOTOS = 8;
export const MAX_PHOTO_BYTES = 2_000_000;
export const MAX_VIDEO_BYTES = 24_000_000;
export const moneyLabel = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

export function videoSource(value: string): { src: string; embed: boolean } | undefined {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password) return;
    const host = url.hostname.toLowerCase();
    if (['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com'].includes(host)) {
      const id = host === 'youtu.be' ? url.pathname.split('/')[1] : url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)$/)?.[1];
      if (id && /^[\w-]{11}$/.test(id)) return { src: 'https://www.youtube-nocookie.com/embed/' + id + '?playsinline=1', embed: true };
      return;
    }
    if (['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'].includes(host)) {
      const id = url.pathname.match(/^\/(?:video\/)?(\d{1,15})\/?$/)?.[1];
      if (id) return { src: 'https://player.vimeo.com/video/' + id + '?dnt=1', embed: true };
      return;
    }
    if (/\.(mp4|webm)$/i.test(url.pathname)) return { src: url.href, embed: false };
  } catch { /* Invalid URL. */ }
}
