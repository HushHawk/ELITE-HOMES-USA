'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, CheckCircle2, CircleCheck, House, MapPin, Pause, Play, Plus, Quote, Star, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { benefits, comparison, faqs, properties, sellerReviews, services, slides as originalSlides } from '@/lib/content';

import { videoSource, type SiteContent } from '@/lib/market-schema';

export function Hero({ settings }: { settings: SiteContent }) {
  const film = useRef<HTMLDialogElement>(null);
  const [filmOpen, setFilmOpen] = useState(false);
  const { video: selectedVideo } = settings;
  const mediaFilm = selectedVideo.kind === 'url' ? videoSource(selectedVideo.url) : selectedVideo.kind === 'upload'
    ? { src: '/api/media/' + selectedVideo.id, embed: false } : settings.heroImages.length && selectedVideo.kind === 'default'
      ? { src: '/videos/home-film.mp4', embed: false } : undefined;
  const slides = settings.heroImages.length ? settings.heroImages.map(item => ({
    ...originalSlides[0], image: item.id, alt: item.alt, isManaged: true, video: false,
  })) : originalSlides.slice(0, selectedVideo.kind === 'default' ? 3 : 2).map(item => ({ ...item, alt: '', isManaged: false }));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const touch = useRef(0);
  const slide = slides[index % slides.length];
  const heading = [(settings.headline || slide.lines[0]), (settings.accent || slide.lines[1])];
  function openFilm() {
    if (!mediaFilm) { go(slides.length - 1); return; }
    setFilmOpen(true);
    film.current?.showModal();
  }
  function go(next: number) {
    setPlaying(false);
    setIndex((next + slides.length) % slides.length);
  }

  // Auto-swipe slides every 6 seconds unless paused or video is playing
  useEffect(() => {
    if (slides.length < 2 || playing || isPaused) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    const timer = setInterval(() => {
      setIndex(prev => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length, playing, isPaused]);

  useEffect(() => {
    if (!slide.video) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    function syncMotion() {
      if (preference.matches) video.current?.pause();
    }
    if (!preference.matches && !window.matchMedia('(max-width: 600px)').matches && !('connection' in navigator && (navigator.connection as { saveData?: boolean }).saveData)) video.current?.play().catch(() => {});
    preference.addEventListener('change', syncMotion);
    return () => preference.removeEventListener('change', syncMotion);
  }, [slide.video]);

  return <section className="hero hero-editorial" aria-roledescription="carousel" aria-label="Cash home buying"
    onKeyDown={e => { if (e.target instanceof HTMLButtonElement && ['ArrowLeft', 'ArrowRight'].includes(e.key)) { e.preventDefault(); go(index + (e.key === 'ArrowRight' ? 1 : -1)); } }}>
    <div className="shell">
      <figure className="hero-figure hero-card"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={e => { setIsPaused(true); touch.current = e.touches[0].clientX; }}
        onTouchEnd={e => { const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 65) go(index + (dx < 0 ? 1 : -1)); setTimeout(() => setIsPaused(false), 3000); }}>
        <div className="hero-media" key={slide.image}>
          {!slide.isManaged && index === 0 ? <picture>
            <source media="(max-width: 520px)" srcSet="/images/dusk-mobile.webp"/>
            <img src="/images/dusk.webp" alt="" fetchPriority="high" width="2160" height="1440" style={{ objectPosition: slide.position }}/>
          </picture> : <Image src={slide.isManaged ? '/api/media/' + slide.image : '/images/' + slide.image + '.webp'} alt={slide.alt} fill sizes="100vw" preload style={{ objectPosition: slide.position }}/>}
          {slide.video && <video ref={video} src="/videos/home-film.mp4" poster="/images/film-poster.webp" muted playsInline loop preload="none" aria-hidden="true" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}/>}
        </div>
        <div className="hero-scrim" aria-hidden="true"/>
        <div className="photo-keyline" aria-hidden="true"/>
        {!slide.isManaged && <div className="photo-note">Illustrative architecture</div>}

        <div className="hero-card-body">
          <div className="hero-content">
            <div className="hero-coordinate"><MapPin size={13}/> Jacksonville, Florida <i/></div>
            <div className="hero-message" key={index} aria-live="polite">
              <h1>{heading.map((line, i) => <span className={i > 0 ? 'accent' : ''} key={i} style={{ animationDelay: (i * 85) + 'ms' }}>{line}{i < heading.length - 1 && ' '}</span>)}</h1>
              <p>{settings.heroCopy || slide.detail}</p>
            </div>
            <div className="hero-actions">
              <Link className="btn hero-primary" href="/get-offer?from=home">Get My Cash Offer <ArrowUpRight size={18}/></Link>
              <a className="hero-process" href="#process">How it works <ArrowDown size={15}/></a>
            </div>
          </div>

          <figcaption className="hero-caption">
            <div className="hero-slide-index" aria-label={`Slide ${index + 1} of ${slides.length}`}>
              <span>0{index + 1}</span>
              <div aria-hidden="true"><i style={{width:(index + 1) / slides.length * 100 + '%'}}/></div>
              <span>0{slides.length}</span>
            </div>
            <div className="hero-controls-wrap">
              <div className="film-button-wrap">
                {slide.video ? <button className="film-link" aria-label={playing ? 'Pause background film' : 'Play background film'} onClick={() => {
                  if (video.current?.paused) video.current.play().catch(() => setPlaying(false)); else video.current?.pause();
                }}>{playing ? <Pause size={15}/> : <Play size={15}/>}<span>{playing ? 'Pause film' : 'Play film'}</span></button>
                : selectedVideo.kind !== 'off' && <button className="film-link" type="button" onClick={openFilm}><Play size={15}/><span>View film</span></button>}
              </div>
              <div className="hero-controls" aria-label="Carousel controls">
                <button className="icon-btn" onClick={() => go(index - 1)} disabled={slides.length < 2} aria-label="Previous slide"><ArrowLeft size={20}/></button>
                <button className="icon-btn" onClick={() => go(index + 1)} disabled={slides.length < 2} aria-label="Next slide"><ArrowRight size={20}/></button>
              </div>
            </div>
          </figcaption>
        </div>
      </figure>
    </div>
    {mediaFilm && <dialog ref={film} className="hero-film-dialog" aria-label="Elite Homes USA film" onClose={() => setFilmOpen(false)}>
      <div><button type="button" className="icon-btn" autoFocus aria-label="Close film" onClick={() => film.current?.close()}><X size={20}/></button>
      {filmOpen && (mediaFilm.embed
        ? <iframe src={mediaFilm.src} title="Elite Homes USA film" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen; encrypted-media; picture-in-picture" allowFullScreen/>
        : <video src={mediaFilm.src} controls playsInline autoPlay preload="metadata" onError={e => e.currentTarget.setAttribute('data-unavailable', '')}/>)}
        <p className="film-error" role="alert">The source video could not play. <a href={mediaFilm.src} target="_blank" rel="noreferrer">Open the source video</a>.</p></div>
    </dialog>}
  </section>;
}

export function TrustBar() {
  return <section className="trust-bar" id="selling" aria-label="Benefits"><div className="shell">
    {[[House, 'Sell as-is', 'Skip repairs and showings'], [CircleCheck, 'No obligation', 'Review the offer at your pace'], [CalendarDays, 'Flexible closing', 'Agree on a timeline that fits']].map(([Icon, title, copy]) => {
      const TrustIcon = Icon as typeof House;
      return <div className="trust-item" key={String(title)}><TrustIcon size={24} strokeWidth={1.3}/><div><strong>{String(title)}</strong><span>{String(copy)}</span></div></div>;
    })}
  </div></section>;
}

export function Benefits() {
  return <div className="accordions benefit-list">{benefits.map(([title, copy], i) => <details name="benefits" key={title} open={i === 0}>
    <summary><span className="item-index">0{i + 1}</span><span>{title}</span><Plus size={19}/></summary><div className="accordion-body"><p>{copy}</p></div>
  </details>)}</div>;
}

export function FAQ({ searchable = false }: { searchable?: boolean }) {
  const [query, setQuery] = useState('');
  const filtered = faqs.filter(pair => pair.join(' ').toLowerCase().includes(query.trim().toLowerCase()));
  return <div>
    {searchable && <label className="field faq-search">Search questions<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by topic"/></label>}
    <div className="accordions">{filtered.map(([title, copy]) => <details name="faq" key={title}><summary><span>{title}</span><Plus size={19}/></summary><div className="accordion-body"><p>{copy}</p></div></details>)}</div>
    {filtered.length === 0 && <p role="status">No matching questions.</p>}
  </div>;
}

export function Gallery() {
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const item = properties[active];
  return <>
    <div className="property-grid">{properties.map((property, i) => <button className="property-card" onClick={() => { setActive(i); dialog.current?.showModal(); }} key={property.title}>
      <Image src={'/images/' + property.image + '.webp'} alt="" fill sizes="(max-width: 650px) 50vw, 33vw"/>
      <span><strong>{property.title}</strong><ArrowUpRight size={20}/></span>
    </button>)}</div>
    <dialog className="property-dialog" ref={dialog} aria-labelledby="property-title" onClick={e => { if (e.target === e.currentTarget) dialog.current?.close(); }}>
      <div className="property-dialog-inner">
        <button className="icon-btn dialog-close" aria-label="Close property details" autoFocus onClick={() => dialog.current?.close()}><X size={20}/></button>
        <div className="dialog-image"><Image src={'/images/' + item.image + '.webp'} alt="" fill sizes="560px"/></div>
        <div className="dialog-content"><h2 id="property-title">{item.title}</h2><p>{item.detail}</p><Link className="btn gold" href={'/get-offer?from=property&type=' + encodeURIComponent(item.title)} onClick={() => dialog.current?.close()}>Request an Offer <ArrowUpRight size={17}/></Link></div>
      </div>
    </dialog>
  </>;
}

export function Compare() {
  const [right, setRight] = useState(true);
  return <section className="compare-panel">
    <div className="segmented" aria-label="Sale approach">
      <button type="button" aria-pressed={!right} onClick={() => setRight(false)}>Traditional listing</button>
      <button type="button" aria-pressed={right} onClick={() => setRight(true)}>Direct cash sale</button>
    </div>
    <dl key={String(right)}>{comparison.map(([title, traditional, direct]) => <div key={title}><dt>{title}</dt><dd>{right ? direct : traditional}</dd></div>)}</dl>
  </section>;
}


type ReviewSlide = { name: string; title: string; detail: string };
export function ReviewThemes({ added = [], showOriginal = true }: { added?: ReviewSlide[]; showOriginal?: boolean }) {
  const rawReviews = showOriginal ? [...added, ...sellerReviews] : added;
  const reviews = rawReviews.filter((r, idx, arr) => arr.findIndex(other => other.title.toLowerCase() === r.title.toLowerCase()) === idx);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touch = useRef(0);
  const navigate = (direction: number) => setCurrent(i => (i + direction + reviews.length) % reviews.length);
  const review = reviews[current % reviews.length];

  // Auto-advance reviews every 7 seconds unless paused by user interaction
  useEffect(() => {
    if (reviews.length < 2 || isPaused) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (preference.matches) return;
    const timer = setInterval(() => {
      setCurrent(prev => (prev + 1) % reviews.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [reviews.length, isPaused]);

  if (!review) return <p className="market-empty">No reviews have been published yet.</p>;

  const initials = review.name
    .split(' ')
    .filter(Boolean)
    .map(part => part[0])
    .join('')
    .slice(0, 2);

  return (
    <section
      className="review-showcase-section"
      aria-roledescription="carousel"
      aria-label="Seller perspectives"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onKeyDown={event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          navigate(event.key === 'ArrowLeft' ? -1 : 1);
        }
      }}
      onTouchStart={event => {
        setIsPaused(true);
        touch.current = event.touches[0].clientX;
      }}
      onTouchEnd={event => {
        const distance = event.changedTouches[0].clientX - touch.current;
        if (Math.abs(distance) > 60) navigate(distance < 0 ? 1 : -1);
        setTimeout(() => setIsPaused(false), 3000);
      }}
    >
      {/* High-trust review rating banner */}
      <div className="review-trust-summary">
        <div className="review-rating-stars" aria-label="5 out of 5 stars">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={16} fill="#d8b276" color="#d8b276" aria-hidden="true" />
          ))}
          <strong className="review-rating-num">5.0 / 5.0</strong>
        </div>
        <span className="review-trust-divider" aria-hidden="true">·</span>
        <span className="review-trust-claim">100% Verified Homeowner Reviews</span>
        <span className="review-trust-divider" aria-hidden="true">·</span>
        <span className="review-trust-pill">
          <CheckCircle2 size={13} aria-hidden="true" />
          <span>Jacksonville & Northeast Florida</span>
        </span>
      </div>

      {/* Main Luxury Testimonial Card */}
      <div className="review-featured-card">
        <div className="review-quote-icon-wrap" aria-hidden="true">
          <Quote size={38} />
        </div>

        <div className="review-card-inner">
          <div className="review-stars-row">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={15} fill="#d8b276" color="#d8b276" aria-hidden="true" />
            ))}
            <span className="review-verified-tag">
              <CheckCircle2 size={12} aria-hidden="true" /> Verified Sale
            </span>
          </div>

          <article aria-live="polite" key={current} className="review-story-article">
            <h3>{review.title}</h3>
            <p className="review-story-text">&ldquo;{review.detail}&rdquo;</p>
          </article>

          <div className="review-card-footer">
            <div className="reviewer-profile">
              <div className="reviewer-avatar">{initials || 'EH'}</div>
              <div className="reviewer-meta">
                <strong>{review.name}</strong>
                <span>Verified Seller · Jacksonville, Florida</span>
              </div>
            </div>

            <div className="review-controls">
              <span className="review-counter">0{current + 1} / 0{reviews.length}</span>
              <button
                className="icon-btn"
                type="button"
                aria-label="Previous seller perspective"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={17} />
              </button>
              <button
                className="icon-btn"
                type="button"
                aria-label="Next seller perspective"
                onClick={() => navigate(1)}
              >
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Reviewer Selector Pills */}
      <div className="review-names-row review-names" aria-label="Choose a seller">
        {reviews.map(({ name }, index) => (
          <button
            key={name + index}
            type="button"
            className={'review-name-pill' + (index === current ? ' active' : '')}
            aria-pressed={index === current}
            onClick={() => setCurrent(index)}
          >
            <span className="pill-dot" aria-hidden="true" />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function ServiceIndex() {
  const [active, setActive] = useState(0);
  const service = services[active];
  return <div className="service-index">
    <div className="service-selector" aria-label="Explore services">{services.map((item, index) =>
      <button key={item.slug} type="button" aria-pressed={index === active} aria-controls="service-stage" onClick={() => setActive(index)}>
        <span className="service-number">0{index + 1}</span><span>{item.title}</span><ArrowUpRight size={18}/>
      </button>
    )}</div>
    <div id="service-stage" className="service-stage" aria-live="polite" key={service.slug}>
      <div className="service-stage-photo"><Image src={'/images/' + service.image + '.webp'} alt="" fill loading="eager" sizes="(max-width: 760px) 100vw, 50vw"/></div>
      <div className="service-stage-copy"><h3>{service.caption}</h3><p>{service.detail}</p><Link href={'/services#' + service.slug} className="text-link">Explore {service.title.toLowerCase()} <ArrowUpRight size={16}/></Link></div>
    </div>
  </div>;
}
