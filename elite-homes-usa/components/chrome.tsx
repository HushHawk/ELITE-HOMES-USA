'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Phone, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { business, navigation } from '@/lib/content';

export function Mark({ size = 40 }: { size?: number }) {
  return <svg className="mark" width={size} height={size} viewBox="0 0 42 42" fill="none" aria-hidden="true">
    <path d="M21 1.4 40.6 12.7v16.6L21 40.6 1.4 29.3V12.7L21 1.4Z" stroke="currentColor" strokeWidth="1"/>
    <path d="M12 29V13h9M12 20.8h8M12 29h9m3-16v16m0-8h6m0-8v16" stroke="currentColor" strokeWidth="1.15"/>
  </svg>;
}

export function Brand() {
  return <Link href="/" className="brand" aria-label="Elite Homes USA home"><Mark/><span><b>ELITE HOMES USA</b></span></Link>;
}

export function Header() {
  const path = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  return <header className={'masthead' + (scrolled ? ' scrolled' : '')}>
    <div className="mast-inner">
      <Brand/>
      <nav className="desktop-nav" aria-label="Main navigation">{navigation.map(([label, url]) => <Link aria-current={path === url ? 'page' : undefined} href={url} key={url}>{label}</Link>)}</nav>
      <div className="head-actions">
        <a href={'tel:+1' + business.phone.replaceAll('-', '')} className="header-phone"><Phone size={14}/> {business.phone}</a>
        <Link className="btn gold compact" href="/get-offer">Say Hello</Link>
        <button className="icon-btn menu-toggle" aria-label="Open navigation" onClick={() => menu.current?.showModal()}><Menu size={23}/></button>
      </div>
    </div>
    <dialog ref={menu} className="mobile-menu" aria-label="Main navigation">
      <div className="menu-head"><Brand/><button autoFocus className="icon-btn" aria-label="Close navigation" onClick={() => menu.current?.close()}><X/></button></div>
      <nav>{navigation.map(([label, url]) => <Link aria-current={path === url ? 'page' : undefined} href={url} key={url} onClick={() => menu.current?.close()}>{label}</Link>)}</nav>
      <Link className="btn gold" href="/get-offer" onClick={() => menu.current?.close()}>Start a Conversation</Link>
    </dialog>
  </header>;
}

export function Reveal() {
  const path = usePathname();
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.setAttribute('data-entered', '');
        entry.target.animate([{ opacity: 0.55, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650, easing: 'cubic-bezier(.18,.7,.3,1)' });
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.12 });
    const frame = requestAnimationFrame(() => document.querySelectorAll('[data-reveal]').forEach(element => {
      if (!element.hasAttribute('data-entered') && element.getBoundingClientRect().top >= window.innerHeight) observer.observe(element);
    }));
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [path]);
  return null;
}
