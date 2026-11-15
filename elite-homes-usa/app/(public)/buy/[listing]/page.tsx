import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { publicListings } from '@/lib/market-store';
import { moneyLabel } from '@/lib/market-schema';
import { isPreview } from '@/lib/store';
import { BuyerForm } from '@/components/market-forms';
import { MarketGallery } from '@/components/market-gallery';
import { ListingFacts, LocationLine } from '@/components/market-editorial';

export const dynamic = 'force-dynamic';

async function loadListing(params: Promise<{ listing: string }>) {
  const { listing } = await params;
  if (!z.uuid().safeParse(listing).success) return;
  return (await publicListings(listing))[0];
}

export async function generateMetadata({ params }: { params: Promise<{ listing: string }> }): Promise<Metadata> {
  const property = await loadListing(params);
  return { title: property?.title || 'Property', description: property?.description.slice(0, 150) };
}

export default async function ListingPage({ params }: { params: Promise<{ listing: string }> }) {
  const listing = await loadListing(params);
  if (!listing) notFound();
  return <article className="listing-page section light"><div className="shell">
    <Link href="/buy#properties" className="text-link listing-back"><ArrowLeft size={16}/> Back to properties</Link>
    <div className="listing-title"><div><LocationLine city={listing.city} state={listing.state}/><h1>{listing.title}</h1><p>{listing.publicAddress || listing.propertyType}</p></div>
      {listing.asking !== null && <strong>{moneyLabel(listing.asking)}</strong>}</div>
    <div className="listing-layout">
      <div>
        <MarketGallery photos={listing.photos.map((id, i) => ({ id, alt: listing.title + ' · Photo ' + (i + 1) }))}/>
        <section className="listing-description"><h2>{listing.propertyType === 'Development project' ? 'About this project' : 'About this property'}</h2><ListingFacts listing={listing}/><p>{listing.description}</p></section>
      </div>
      <div>{listing.status === 'Published' ? <BuyerForm listing={listing.id} asking={listing.asking} preview={isPreview()}/> : <div className="form-panel"><h2>Under contract</h2><p>Explore other available properties in the buyer portal.</p><Link href="/buy#properties" className="text-link">See other properties</Link></div>}</div>
    </div>
  </div></article>;
}
