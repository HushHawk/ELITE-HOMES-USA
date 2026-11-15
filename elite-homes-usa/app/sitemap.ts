import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = process.env.ELITE_SITE_URL;
  if (!site || process.env.ELITE_MODE !== 'live') return [];
  return ['', '/sell', '/buy', '/about', '/services', '/reviews', '/contact', '/get-offer', '/how-it-works', '/faq', '/privacypolicy', '/terms-of-use'].map(path => ({ url: new URL(path || '/', site).href }));
}
