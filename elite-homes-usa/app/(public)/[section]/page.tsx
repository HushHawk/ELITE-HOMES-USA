import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, CheckCircle2, Clock, Mail, MapPin, Phone, ShieldCheck, Sparkles, Video } from 'lucide-react';
import { notFound } from 'next/navigation';
import { EditorialImage, Eyebrow, FinalCTA, OfferLink, PageHero, Process } from '@/components/editorial';
import { FAQ, ReviewThemes } from '@/components/interactions';
import { OfferWizard, Receipt, SimpleForm, Unsubscribe } from '@/components/forms';
import { business, services } from '@/lib/content';
import { propertyTypes } from '@/lib/schema';
import { ReviewForm } from '@/components/market-forms';
import { SocialButtons } from '@/components/social-icons';
import { publishedReviews, siteContent } from '@/lib/market-store';
import { isPreview } from '@/lib/store';

const pages = {
  about: { title: 'People first.', accent: 'Property second.', image: 'jacksonville', kicker: 'About', description: 'Meet the Jacksonville team behind a more personal approach to selling your home.' },
  services: { title: 'A simpler way', accent: 'to sell.', image: 'villa', kicker: 'Services', description: 'Explore the ways we can make a direct sale feel more manageable, from a friendly walk-through to a flexible closing.' },
  reviews: { title: 'In their', accent: 'experience.', image: 'interior', kicker: 'Reviews', description: 'Read what sellers shared about their experiences with Elite Homes USA.' },
  contact: { title: 'Let’s start a', accent: 'conversation.', image: 'entry', kicker: 'Contact', description: 'Tell our Jacksonville team what you’re considering and ask any questions about selling your home.' },
  'how-it-works': { title: 'Know what', accent: 'comes next.', image: 'film-poster', kicker: 'How it works', description: 'From telling us about your home to a walk-through and reviewing your offer, you’ll have time to understand every step.' },
  faq: { title: 'Good to', accent: 'know.', image: 'kitchen', kicker: 'FAQs', description: 'Answers to common questions about our process, selling as-is and closing.' },
} as const;

const titles: Record<string, string> = {
  about: 'About Darren Richardson', services: 'Home Buying Services', reviews: 'Seller Reviews', contact: 'Contact',
  'how-it-works': 'How It Works', 'get-offer': 'Tell Us About Your Home', faq: 'Frequently Asked Questions',
  privacypolicy: 'Privacy Policy', 'terms-of-use': 'Terms of Use', 'thank-you': 'Request Receipt', unsubscribe: 'Manage Email Subscription',
};

export async function generateMetadata({ params }: { params: Promise<{ section: string }> }): Promise<Metadata> {
  const { section } = await params;
  if (!titles[section]) return {};
  return {
    title: titles[section],
    description: pages[section as keyof typeof pages]?.description || (section === 'get-offer' ? 'Tell Elite Homes USA about your Jacksonville-area property and we’ll set up a time to see it.' : undefined),
    alternates: process.env.ELITE_SITE_URL ? { canonical: '/' + section } : undefined,
    ...(['thank-you', 'unsubscribe'].includes(section) && { robots: { index: false, follow: false } }),
  };
}

function Story() {
  return <>
    {/* My Story / Meet Darren Richardson */}
    <section className="section light about-story-section">
      <div className="shell about-story-grid">
        <div className="about-story-copy" data-reveal>
          <Eyebrow>My Story</Eyebrow>
          <h2>Meet Darren <em>Richardson</em></h2>
          <div className="founder-cred-pill">
            <MapPin size={13} aria-hidden="true" />
            <span>Jacksonville, Florida · Owner & Real Estate Specialist</span>
          </div>

          <p className="about-story-lead">
            My passion for real estate stems from personal experience, having stepped in to help my own family through tough financial times. That experience opened my eyes to the many families facing similar challenges, and it became my mission to offer guidance and support to those in need.
          </p>

          <p>
            With years of experience working closely with a variety of lenders and banks, I have developed an in-depth understanding of how these institutions operate. This expertise allows me to navigate complex financial situations and advocate for my clients effectively. I am committed to using this knowledge to help families find solutions, whether they’re buying, selling, or managing difficult real estate issues.
          </p>

          <p>
            At the core of my work is a genuine dedication to helping people. I take pride in turning what could be overwhelming challenges into manageable solutions, ensuring my clients have the information, tools, and support they need to succeed in their real estate journeys.
          </p>

          <div className="founder-contact-actions">
            <a href={'tel:+1' + business.phone.replace(/\D/g, '').slice(-10)} className="btn gold compact">
              <Phone size={15} aria-hidden="true" />
              <span>Call Darren: {business.phone}</span>
            </a>
            <a href={'mailto:' + business.email} className="btn outline compact">
              <Mail size={15} aria-hidden="true" />
              <span>Email: {business.email}</span>
            </a>
          </div>
        </div>

        <div className="about-founder-visual" data-reveal>
          <div className="founder-card-frame">
            <div className="founder-image-wrapper">
              <Image
                src="/images/darren-richardson.webp"
                alt="Darren Richardson smiling in professional attire against greenery"
                width={700}
                height={700}
                className="founder-portrait-img"
                priority
              />
              <div className="founder-image-overlay-glow" />
            </div>
            <div className="founder-card-badge">
              <strong>Darren Richardson</strong>
              <span>Owner & Founder · Elite Homes USA</span>
              <small>Dedicated Homeowner Advocate · Jacksonville, FL</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Our Mission */}
    <section className="section dark about-mission-section">
      <div className="shell about-mission-inner">
        <div className="about-mission-header" data-reveal>
          <Eyebrow>Our Mission</Eyebrow>
          <h2>Committed to Simplifying the<br /><em>Home-Selling Process</em></h2>
          <p className="mission-statement">
            Our mission is to give homeowners a reliable, caring and stress-free alternative to traditional real estate transactions. We take the time to see each home and understand each family, so you can move forward with ease and confidence.
          </p>
        </div>

        <div className="about-mission-grid" data-reveal>
          <div className="mission-card">
            <div className="mission-card-icon"><Sparkles size={22} aria-hidden="true" /></div>
            <h3>Reliable & Caring</h3>
            <p>A direct purchase process with clear terms, so you aren’t waiting on bank approvals or appraisals.</p>
          </div>
          <div className="mission-card">
            <div className="mission-card-icon"><ShieldCheck size={22} aria-hidden="true" /></div>
            <h3>Stress-Free Selling</h3>
            <p>Sell directly as-is without staging, repeated public open houses, or spending savings on repairs.</p>
          </div>
          <div className="mission-card">
            <div className="mission-card-icon"><CheckCircle2 size={22} aria-hidden="true" /></div>
            <h3>Clear, Honest Terms</h3>
            <p>No agent commissions, and every cost explained up front and provided in writing, so there are no surprises.</p>
          </div>
        </div>

        <div className="about-mission-action" data-reveal>
          <OfferLink>Start a Conversation</OfferLink>
        </div>
      </div>
    </section>

    {/* Why We're Different / What Sets Us Apart */}
    <section className="section light about-difference-section">
      <div className="shell">
        <div className="section-heading about-diff-head" data-reveal>
          <Eyebrow>Why We’re Different</Eyebrow>
          <h2>What Sets Us <em>Apart</em></h2>
          <p>
            At Elite Homes USA, we believe in putting the needs of homeowners first. Unlike other buyers, we focus on providing a personal, tailored experience that works for you. Our personal walk-throughs, commitment to transparency and deep knowledge of the local market allow us to create solutions that are both fair and thoughtful.
          </p>
        </div>

        <div className="difference-grid" data-reveal>
          <div className="diff-card">
            <div className="diff-card-icon"><Clock size={24} aria-hidden="true" /></div>
            <div className="diff-card-content">
              <h3>We See It First</h3>
              <p>An in-person visit or your photos and video, then a walk-through.</p>
            </div>
          </div>

          <div className="diff-card">
            <div className="diff-card-icon"><ShieldCheck size={24} aria-hidden="true" /></div>
            <div className="diff-card-content">
              <h3>No Repairs Needed</h3>
              <p>Share your home as it is today.</p>
            </div>
          </div>

          <div className="diff-card">
            <div className="diff-card-icon"><CheckCircle2 size={24} aria-hidden="true" /></div>
            <div className="diff-card-content">
              <h3>Clear Terms</h3>
              <p>Clear terms, provided in writing.</p>
            </div>
          </div>

          <div className="diff-card">
            <div className="diff-card-icon"><MapPin size={24} aria-hidden="true" /></div>
            <div className="diff-card-content">
              <h3>Local Market Expertise</h3>
              <p>Years of experience in the communities we serve.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </>;
}

function ServiceList() {
  return (
    <>
      <section className="section light service-header-section">
        <div className="shell">
          <div className="section-heading" data-reveal>
            <Eyebrow>Tailored Real Estate Services</Eyebrow>
            <h2>Expert Home Buying Solutions<br/><em>That Work for You</em></h2>
            <p className="service-intro-lead">
              At Elite Homes USA, we offer a range of home-buying services tailored to your specific needs. Whether you’d like a walk-through before anything else, need flexibility in closing, or want to sell your home without repairs, we’re here to help. Explore our services below to see how we can support you.
            </p>
          </div>
        </div>
      </section>

      <section className="service-list light">
        <div className="shell">
          {services.map((service, i) => (
            <article className="service-feature" id={service.slug} key={service.slug} data-reveal>
              <EditorialImage name={service.image} alt="" className="service-feature-image"/>
              <div>
                <Eyebrow>Service 0{i + 1}</Eyebrow>
                <h2>{service.title}</h2>
                <p>{service.detail}</p>
                <div className="service-key-benefits-box">
                  <strong>Key Benefits:</strong>
                  <ul>
                    {service.points.map(point => (
                      <li key={point}>
                        <CheckCircle2 size={16} aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="service-feature-action">
                  <OfferLink>Start a Conversation</OfferLink>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section dark service-ready-section">
        <div className="shell">
          <div className="service-ready-card" data-reveal>
            <Eyebrow>Whenever you’re ready</Eyebrow>
            <h2>No matter your situation,<br/><em>we’re glad to listen.</em></h2>
            <p>
              Reach out to Elite Homes USA whenever you’re ready. We’ll arrange a visit or look at your photos and video, and prepare an offer after a walk-through.
            </p>
            <div className="service-ready-actions">
              <Link href="/get-offer" className="btn gold">
                <span>Tell Us About Your Home</span>
               
              </Link>
              <a href={'tel:+1' + business.phone.replace(/\D/g, '').slice(-10)} className="btn outline">
                <Phone size={15} aria-hidden="true" />
                <span>Call {business.phone}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

async function SellerFeedback() {
  const [{ content }, reviews] = await Promise.all([siteContent(), publishedReviews()]);
  return <><section className="section light"><div className="shell"><div className="section-heading"><Eyebrow>Seller feedback</Eyebrow><h2>What sellers <em>shared.</em></h2></div><ReviewThemes added={reviews} showOriginal={content.showOriginalReviews}/></div></section>
  <section className="section warm"><div className="shell portal-form-grid"><div><Eyebrow>Customer reviews</Eyebrow><h2>Tell us how <em>it went.</em></h2><p>Your feedback goes to our team for review before it appears on the website.</p></div><ReviewForm preview={isPreview()}/></div></section></>;
}

function Contact() {
  return (
    <section className="section light contact-page-section">
      <div className="shell split contact-grid">
        <div className="contact-details-col">
          <Eyebrow>Direct Jacksonville Office</Eyebrow>
          <h2>We’re here <em>to listen.</em></h2>
          <p className="contact-mission-note">
            Whether you are considering a direct sale, exploring options for an inherited or as-is property, or seeking honest guidance on your Jacksonville home, we are here with straightforward answers and no pressure.
          </p>

          <div className="contact-methods">
            <a href="tel:+19049906760" className="contact-method-card">
              <div className="contact-icon-bubble"><Phone size={20} /></div>
              <div>
                <small>Call us</small>
                <strong>{business.phone}</strong>
                <span className="contact-subline">Mon – Sat: 8:00 AM – 7:00 PM EST</span>
              </div>
            </a>

            <a href={'mailto:' + business.email} className="contact-method-card">
              <div className="contact-icon-bubble"><Mail size={20} /></div>
              <div>
                <small>Email us</small>
                <strong>{business.email}</strong>
                <span className="contact-subline">We’ll reply as soon as we can</span>
              </div>
            </a>

            <div className="contact-method-card static">
              <div className="contact-icon-bubble"><MapPin size={20} /></div>
              <div>
                <small>Mailing address</small>
                <strong>{business.mailingAddress}</strong>
                <span className="contact-subline">Jacksonville, Florida 32257</span>
              </div>
            </div>

            <a href={'mailto:' + business.email + '?subject=Zoom%20consultation%20request'} className="contact-method-card">
              <div className="contact-icon-bubble"><Video size={20} /></div>
              <div>
                <small>Virtual video call</small>
                <strong>Ask for a Zoom consultation</strong>
                <span className="contact-subline">Meet Darren Richardson virtually</span>
              </div>
              <ArrowUpRight size={16} className="contact-card-arrow" />
            </a>
          </div>

          <div className="contact-trust-badges">
            <div className="contact-badge-item">
              <ShieldCheck size={16} />
              <span>100% Confidential</span>
            </div>
            <div className="contact-badge-item">
              <Clock size={16} />
              <span>Friendly, Prompt Replies</span>
            </div>
            <div className="contact-badge-item">
              <Sparkles size={16} />
              <span>No Pressure</span>
            </div>
          </div>

          <div className="contact-social-section">
            <small>Follow us & market updates</small>
            <SocialButtons className="contact-social-row" size={20} />
          </div>
        </div>

        <div className="contact-form-col">
          <SimpleForm kind="contact" preview={process.env.ELITE_MODE !== 'live'} />
        </div>
      </div>
    </section>
  );
}

function Legal({ section }: { section: string }) {
  const privacy = section === 'privacypolicy';
  return <section className="section utility-page light"><div className="shell utility-inner"><Eyebrow>{business.name}</Eyebrow><h1>{privacy ? 'Privacy Policy' : 'Terms of Use'}</h1>
    <p>The current {privacy ? 'privacy policy' : 'terms of use'} is published on the original Elite Homes USA website. The updated document for this website is pending approval.</p>
    <a className="btn gold" href={business.source + '/' + section}>Read the Current {privacy ? 'Privacy Policy' : 'Terms'}</a>
    <p>{privacy ? 'Effective June 29, 2026.' : 'Effective March 1, 2024. Last updated June 29, 2026.'}</p>
    <p>{privacy ? 'The published policy covers property and contact information, communications and SMS preferences, data sharing, cookies, security and privacy requests.' : 'The published terms cover website use, offer eligibility, limits on estimates and outcomes, communications, liability and Florida governing law.'}</p>
    <p>For policy questions, email <a href={'mailto:' + business.email}>{business.email}</a> or call <a href="tel:+19045155092">{business.legalPhone}</a>, the number shown in the current policy documents.</p>
  </div></section>;
}

export default async function Interior({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { section } = await params;
  if (!Object.hasOwn(titles, section)) notFound();

  if (section === 'get-offer') {
    const query = await searchParams;
    const type = propertyTypes.find(value => value === query.type);
    const source = ['home', 'property'].find(value => value === query.from) || 'website';
    return <section className="offer-page light">
      <div className="offer-visual">
        <EditorialImage name="entry" alt="" eager sizes="(max-width: 900px) 100vw, 42vw"/>
        <div className="hero-shade"/>
        <div><Link className="crumb" href="/">Home / Your Home</Link><Eyebrow>Sell on your terms</Eyebrow><h1>Your next move <em>starts here.</em></h1><p>Share a few details so we can say hello, learn about your home and set up a visit or a look at your photos and video. We’ll prepare an offer after a walk-through.</p><span className="image-label">Illustrative architecture</span></div>
      </div>
      <div className="offer-panel"><OfferWizard preview={process.env.ELITE_MODE !== 'live'} type={type} source={source}/></div>
    </section>;
  }
  if (section === 'privacypolicy' || section === 'terms-of-use') return <Legal section={section}/>;
  if (section === 'thank-you' || section === 'unsubscribe') return <section className="section utility-page light"><div className="shell utility-inner">{section === 'thank-you' ? <Receipt/> : <Unsubscribe/>}</div></section>;

  const page = pages[section as keyof typeof pages];
  return <>
    <PageHero {...page}/>
    {section === 'about' && <Story/>}
    {section === 'services' && <ServiceList/>}
    {section === 'reviews' && <SellerFeedback/>}
    {section === 'contact' && <Contact/>}
    {section === 'how-it-works' && <Process showRouteLink={false}/>}
    {['faq', 'services', 'how-it-works'].includes(section) && <section className="section warm"><div className="shell split"><div><Eyebrow>Questions from sellers</Eyebrow><h2>Frequently <em>asked.</em></h2><Link className="text-link" href="/contact">Ask our team <ArrowUpRight size={17}/></Link></div><FAQ searchable={section === 'faq'}/></div></section>}
    {section !== 'contact' && <FinalCTA/>}
  </>;
}
