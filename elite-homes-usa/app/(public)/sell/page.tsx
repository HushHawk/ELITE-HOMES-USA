import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, Camera, ClipboardCheck, Phone } from 'lucide-react';
import { SellerForm } from '@/components/market-forms';
import { MarketCover } from '@/components/market-editorial';
import { Eyebrow } from '@/components/editorial';
import { isPreview } from '@/lib/store';

export const metadata: Metadata = { title: 'Seller Portal', description: 'Submit your property details and photos privately to Elite Homes USA for review.' };

const process = [
  [Camera, 'Share the property', 'Send photos, condition and any recent updates so we can understand the home.'],
  [ClipboardCheck, 'We review it', 'Our team reviews the submission, asks for any missing details and discusses options with you.'],
  [Phone, 'Talk to our team', 'If there’s a fit, we’ll follow up directly on the phone or by email.'],
] as const;

export default function SellPage() {
  return <><MarketCover kind="sell"/>
    <section id="submit-property" className="section light"><div className="shell portal-form-grid">
      <div className="portal-guide">
        <Eyebrow>What to expect</Eyebrow><h2>Start with the <em>details.</em></h2>
        <ol>{process.map(([Icon, title, detail]) => <li key={title}><Icon size={20}/><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ol>
        <Link className="text-link" href="/contact">Contact our team <ArrowUpRight size={16}/></Link>
      </div>
      <SellerForm preview={isPreview()}/>
    </div></section>
  </>;
}
