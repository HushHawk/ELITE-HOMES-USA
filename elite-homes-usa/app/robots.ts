import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = process.env.ELITE_SITE_URL;
  return process.env.ELITE_MODE === 'live'
    ? { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/thank-you', '/unsubscribe'] }, ...(site && { sitemap: new URL('/sitemap.xml', site).href }) }
    : { rules: { userAgent: '*', disallow: '/' } };
}
