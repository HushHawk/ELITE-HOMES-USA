import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Clock, Mail, MapPin, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { business, navigation, steps } from '@/lib/content';
import { Brand } from './chrome';
import { SimpleForm } from './forms';
import { SocialButtons } from './social-icons';

export function EditorialImage({ name, alt, className = '', eager = false, sizes = '(max-width: 760px) 100vw, 50vw' }: { name: string; alt: string; className?: string; eager?: boolean; sizes?: string }) {
  return <div className={'editorial-image ' + className}><Image src={'/images/' + name + '.webp'} fill alt={alt} sizes={sizes} loading={eager ? 'eager' : 'lazy'}/></div>;
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <span className="eyebrow section-label"><i/>{children}</span>;
}

export function OfferLink({ children = 'Start a Conversation' }: { children?: React.ReactNode }) {
  return <Link href="/get-offer" className="btn gold">{children}</Link>;
}

export function PageHero({ title, accent, image, kicker, description }: { title: string; accent?: string; image: string; kicker: string; description: string }) {
  return <section className="page-hero">
    <Image src={'/images/' + image + '.webp'} fill alt="" sizes="100vw" preload/>
    <div className="hero-shade"/>
    <div className="shell page-hero-content">
      <nav className="crumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span aria-current="page">{kicker}</span></nav>
      <h1>{title} {accent && <em>{accent}</em>}</h1><p>{description}</p>
    </div>
    <span className="page-credit">{image === 'jacksonville' ? 'Main Street Bridge · Jacksonville, Florida' : 'Illustrative architecture'}</span>
  </section>;
}

export function Process({ showRouteLink = true }: { showRouteLink?: boolean }) {
  return <section className="section process-section" id="process">
    <div className="shell process-spread">
      <div className="section-heading process-copy" data-reveal>
        <Eyebrow>How it works</Eyebrow><h2>A clear path<br/><em>to closing.</em></h2>
        <p>Tell us about your home. We’ll view it in person, or through your photos and video, and after a walk-through we’ll prepare an offer for you to review at your own pace.</p>
        <div className="section-action"><OfferLink/>{showRouteLink && <Link className="text-link" href="/how-it-works">Explore the process <ArrowRight size={15}/></Link>}</div>
      </div>
      <ol className="process-grid" data-reveal>{steps.map(({ title, detail }, i) => <li key={title}><span className="step-number">0{i + 1}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ol>
    </div>
  </section>;
}

export function FinalCTA({ title, copy }: { title?: string; copy?: string }) {
  return <section className="final-cta">
    <Image src="/images/footer.webp" fill alt="" sizes="100vw"/>
    <div className="hero-shade"/>
    <div className="shell" data-reveal><Eyebrow>Your next move</Eyebrow><h2>{title || <>Let’s make it <em>simple.</em></>}</h2><p>{copy || 'Share a few details about your home to start a conversation.'}</p><OfferLink/></div>
  </section>;
}

export function Footer({ preview }: { preview: boolean }) {
  return (
    <footer className="footer luxury-footer">
      {/* Top Main Footer Grid */}
      <div className="shell footer-grid">
        {/* Column 1: Brand & Executive Summary */}
        <div className="footer-brand-col">
          <Brand />
          <p className="footer-brand-bio">
            A direct, transparent, and stress-free alternative to traditional real estate transactions. We purchase properties as-is across Jacksonville and Northeast Florida with no agent commissions, no repairs, and closing dates that fit your plans.
          </p>
          <div className="footer-contact-list">
            <a href="tel:+19049906760" className="footer-contact-link">
              <Phone size={14} aria-hidden="true" />
              <span>{business.phone}</span>
            </a>
            <a href={'mailto:' + business.email} className="footer-contact-link">
              <Mail size={14} aria-hidden="true" />
              <span>{business.email}</span>
            </a>
            <div className="footer-contact-link static">
              <MapPin size={14} aria-hidden="true" />
              <span>{business.mailingAddress}</span>
            </div>
            <div className="footer-contact-link static">
              <Clock size={14} aria-hidden="true" />
              <span>Mon – Sat: 8:00 AM – 7:00 PM EST</span>
            </div>
          </div>
          <div className="footer-social-wrap">
            <span className="footer-social-label">Follow us</span>
            <SocialButtons />
          </div>
        </div>

        {/* Column 2: Selling & Buying Solutions */}
        <nav className="footer-nav-col" aria-label="Selling and buying navigation">
          <h2>Selling Solutions</h2>
          <Link href="/get-offer">Tell Us About Your Home</Link>
          <Link href="/sell">Sell Your Property</Link>
          <Link href="/buy">Browse Homes for Sale</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/services">Real Estate Services</Link>
        </nav>

        {/* Column 3: Company & Story */}
        <nav className="footer-nav-col" aria-label="Company navigation">
          <h2>About & Support</h2>
          <Link href="/about">Meet Darren Richardson</Link>
          <Link href="/about">Why We’re Different</Link>
          <Link href="/reviews">Homeowner Reviews</Link>
          <Link href="/faq">Frequently Asked Questions</Link>
          <Link href="/contact">Contact Our Team</Link>
        </nav>

        {/* Column 4: Jacksonville Communities */}
        <div className="footer-nav-col communities-col">
          <h2>Service Areas</h2>
          <span>Jacksonville & Duval County</span>
          <span>San Marco & Southside</span>
          <span>Riverside & Avondale</span>
          <span>Jacksonville Beaches</span>
          <span>Orange Park & Clay County</span>
          <span>St. Augustine & St. Johns</span>
        </div>

        {/* Column 5: Newsletter & Market Dispatch */}
        <div className="footer-newsletter-col">
          <h2>Stay Informed</h2>
          <p>Get occasional off-market property alerts and Jacksonville market updates directly from our team.</p>
          <SimpleForm kind="newsletter" preview={preview} />
        </div>
      </div>

      {/* Trust & Guarantee Banner */}
      <div className="shell footer-guarantee-strip">
        <div className="guarantee-pill">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>Local Jacksonville Home Buyer</span>
        </div>
        <div className="guarantee-pill">
          <Sparkles size={16} aria-hidden="true" />
          <span>No Agent Commissions</span>
        </div>
        <div className="guarantee-pill">
          <Clock size={16} aria-hidden="true" />
          <span>Offers After a Walk-Through</span>
        </div>
      </div>

      {/* Bottom Legal & Copyright Bar */}
      <div className="shell footer-bottom">
        <span>© {new Date().getFullYear()} {business.name}. All rights reserved.</span>
        <span>Equal Housing Opportunity · Property imagery is illustrative</span>
        <div className="footer-legal-links">
          <Link href="/privacypolicy">Privacy</Link>
          <Link href="/terms-of-use">Terms</Link>
          <Link href="/admin">Owner sign-in</Link>
        </div>
      </div>
    </footer>
  );
}
