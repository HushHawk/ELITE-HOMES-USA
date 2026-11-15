import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.ELITE_SITE_URL;

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl), alternates: { canonical: '/' } } : {}),
  title: { default: 'Elite Homes USA | Sell Your Home on Your Terms', template: '%s | Elite Homes USA' },
  description: 'Explore a direct cash offer for your Jacksonville-area home with Elite Homes USA. Sell as-is and discuss a closing timeline that fits.',
  openGraph: { type: 'website', siteName: 'Elite Homes USA', ...(siteUrl && { images: ['/images/dusk.webp'] }) },
  robots: process.env.ELITE_MODE === 'live' ? undefined : { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const _sa = Element.prototype.setAttribute;
                Element.prototype.setAttribute = function(k, v) {
                  if (k && (k.startsWith('bis_') || k.startsWith('__processed_'))) return;
                  return _sa.apply(this, arguments);
                };
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
