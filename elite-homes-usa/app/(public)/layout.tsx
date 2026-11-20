import { Header, Reveal } from '@/components/chrome';
import { Footer } from '@/components/editorial';
import { LiveAssistantChat } from '@/components/live-assistant-chat';
import { business } from '@/lib/content';

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: business.name,
  founder: business.founder,
  telephone: '+1' + business.phone.replace(/\D/g, ''),
  email: business.email,
  address: { '@type': 'PostalAddress', streetAddress: '1036 Dunn Ave., Suite 4-295', addressLocality: 'Jacksonville', addressRegion: 'FL', postalCode: '32218', addressCountry: 'US' },
  areaServed: 'Jacksonville, Florida and Northeast Florida',
  sameAs: business.socials.map(item => item.href),
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}/>
    <a className="skip" href="#main">Skip to content</a>
    <Header/>
    <main id="main">{children}</main>
    <Footer preview={process.env.ELITE_MODE !== 'live'}/>
    <LiveAssistantChat />
    <Reveal/>
  </>;
}
