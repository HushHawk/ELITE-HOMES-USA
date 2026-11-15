import Link from 'next/link';
import { Brand } from '@/components/chrome';

export default function NotFound() {
  return <main className="missing dark"><Brand/><p className="eyebrow">Page not found</p><h1>Let’s get you <em>home.</em></h1><div className="section-action"><Link className="btn gold" href="/">Back to Home</Link><Link className="btn outline" href="/contact">Contact Us</Link></div></main>;
}
