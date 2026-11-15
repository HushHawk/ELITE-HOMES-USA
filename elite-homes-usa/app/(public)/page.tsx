import Link from 'next/link';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Compare, Benefits, FAQ, Gallery, Hero, ReviewThemes, ServiceIndex, TrustBar } from '@/components/interactions';
import { EditorialImage, Eyebrow, FinalCTA, OfferLink, Process } from '@/components/editorial';
import { business } from '@/lib/content';
import { AddressStarter, QuickCashOfferForm } from '@/components/forms';
import { MarketGallery } from '@/components/market-gallery';
import { publishedReviews, siteContent } from '@/lib/market-store';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [{content}, reviews] = await Promise.all([siteContent(), publishedReviews()]);
  return <>
    <Hero settings={content}/>
    <section className="quick-intake" aria-label="Start a cash offer request">
      <div className="shell">
        <QuickCashOfferForm />
      </div>
    </section>
    <TrustBar/>
    <section className="section warm marketplace-entry"><div className="shell"><div className="section-heading"><Eyebrow>Buy and sell</Eyebrow><h2>Where are you <em>headed?</em></h2></div>
      <div className="market-paths"><Link href="/sell"><EditorialImage name="interior" alt=""/><div><h3>Sell a property</h3><p>Send your property photos and details to our team for private review.</p><span>Open the seller portal <ArrowUpRight size={17}/></span></div></Link>
      <Link href="/buy"><EditorialImage name="villa" alt=""/><div><h3>Buy a property</h3><p>Browse approved listings and send a cash offer on a property that fits.</p><span>Open the buyer portal <ArrowUpRight size={17}/></span></div></Link></div>
    </div></section>
    <section className="section light">
      <div className="shell intro-grid">
        <div data-reveal><Eyebrow>Home selling, simplified</Eyebrow><h2>{content.introductionTitle || <>People first.<br/><em>Property second.</em></>}</h2><p>{content.introduction || 'Every home sale starts with a reason. At Elite Homes USA, we start by listening to yours. Our Jacksonville team helps homeowners explore a direct cash sale with clear terms and room to decide.'}</p><Link className="text-link" href="/about">Meet Darren Richardson <ArrowUpRight size={17}/></Link></div>
        <div data-reveal><EditorialImage name="interior" alt="Neutral living room with warm wood and soft seating" className="intro-image"/><span className="image-label">Illustrative interior</span></div>
      </div>
    </section>
    <section className="section dark">
      <div className="shell benefit-grid">
        <div data-reveal>
          <Eyebrow>Why Elite Homes USA?</Eyebrow>
          <h2>Why clients continue<br/><em>to choose us.</em></h2>
          <p className="benefit-intro-lead">At Elite Homes USA, we pride ourselves on offering a seamless, stress-free solution for homeowners who need to sell fast.</p>
          <EditorialImage name="kitchen" alt="Contemporary kitchen with stone counters" className="benefit-photo"/>
        </div>
        <Benefits/>
      </div>
    </section>
    <section className="section warm service-editorial">
      <div className="shell">
        <div className="heading-row" data-reveal><div><Eyebrow>Expert Home Buying Solutions</Eyebrow><h2>Solutions tailored<br/><em>to your needs.</em></h2></div><Link className="text-link" href="/services">View full services <ArrowRight size={16}/></Link></div>
        <ServiceIndex/>
      </div>
    </section>
    <section className="section dark gallery-section">
      <div className="shell"><div className="section-heading" data-reveal><Eyebrow>Properties we consider</Eyebrow><h2>Every home has<br/><em>a next chapter.</em></h2><p>Select a property type to see what we consider during review.</p></div><Gallery/><p className="image-label">Illustrative photography</p></div>
    </section>
    {content.gallery.length > 0 && <section className="section warm"><div className="shell"><div className="section-heading"><Eyebrow>Gallery</Eyebrow><h2>Property <em>gallery.</em></h2></div><MarketGallery photos={content.gallery} wall label="Homepage gallery"/></div></section>}
    <Process/>
    <section className="section light compare-section"><div className="shell split"><div data-reveal><Eyebrow>Find your fit</Eyebrow><h2>Two paths<br/><em>to selling.</em></h2><p>See what the two approaches may involve as you weigh your options.</p><Link href="/how-it-works" className="text-link">Read about the process <ArrowRight size={16}/></Link></div><Compare/></div></section>
    <section className="section warm reviews-teaser"><div className="shell"><div className="heading-row"><div><Eyebrow>Seller experiences</Eyebrow><h2>In their <em>experience.</em></h2></div><Link className="text-link" href="/reviews">Read the reviews <ArrowRight size={16}/></Link></div><ReviewThemes added={reviews} showOriginal={content.showOriginalReviews}/></div></section>
    <section className="section light"><div className="shell split faq-section"><div data-reveal><Eyebrow>Frequently asked questions</Eyebrow><h2>Good to <em>know.</em></h2><p>Want to talk through your situation?</p><Link href="/contact" className="text-link">Contact our team <ArrowUpRight size={17}/></Link></div><FAQ/></div></section>
    <section className="section warm"><div className="shell intro-grid"><figure className="local-city"><EditorialImage name="jacksonville" alt="Jacksonville skyline beside the Main Street Bridge" className="local-image"/><figcaption className="image-label">Main Street Bridge · Jacksonville, Florida</figcaption></figure><div data-reveal><Eyebrow>Jacksonville, Florida</Eyebrow><h2>A local <em>conversation.</em></h2><p>Tell us where your home is and what you’d like your next move to look like. We’ll confirm if it’s within our buying area and talk through your options.</p><OfferLink/></div></div></section>
    <FinalCTA title={content.closingTitle} copy={content.closingCopy}/>
  </>;
}
