import Link from 'next/link';
import { ArrowUpRight, BedDouble, Bath, Box, MapPin } from 'lucide-react';
import { EditorialImage, Eyebrow } from './editorial';
import type { PublicListing } from '@/lib/market-schema';

export function MarketCover({ kind }: { kind: 'sell' | 'buy' }) {
  const seller = kind === 'sell';
  return <section className={'portal-cover ' + kind}>
    <div className="shell portal-cover-grid">
      <div className="portal-cover-copy"><Eyebrow>{seller ? 'Seller portal' : 'Buyer portal'}</Eyebrow>
        <h1>{seller ? 'Show us' : 'Find your'}<br/><em>{seller ? 'your property.' : 'next property.'}</em></h1>
        <p>{seller ? 'Share the details and photos privately with Elite Homes USA. We’ll review your submission, arrange a visit or video walkthrough, and talk through the next steps together.' : 'Explore properties and projects approved by Elite Homes USA. See the details and send an offer directly to our team.'}</p>
        <a href={seller ? '#submit-property' : '#properties'} className="btn gold">{seller ? 'Start Your Submission' : 'Browse Properties'}</a>
        <Link className="text-link" href={seller ? '/buy' : '/sell'}>{seller ? 'Explore the buyer portal' : 'Looking to sell?'} <ArrowUpRight size={15}/></Link>
      </div>
      <figure className="portal-cover-photo"><EditorialImage name={seller ? 'interior' : 'villa'} alt="" eager sizes="(max-width: 760px) 100vw, 53vw"/><figcaption>Illustrative architecture</figcaption></figure>
    </div>
  </section>;
}

export function ListingFacts({ listing }: { listing: PublicListing }) {
  const facts = [
    [BedDouble, listing.bedrooms, ' beds'],
    [Bath, listing.bathrooms, ' baths'],
    [Box, listing.area, ' sq ft'],
  ] as const;
  return <ul className="listing-facts" aria-label="Property facts">{facts.map(([Icon, value, unit]) =>
    value === null ? null : <li key={unit}><Icon size={17}/>{value.toLocaleString('en-US') + unit}</li>)}</ul>;
}

export function LocationLine({ city, state }: Pick<PublicListing, 'city' | 'state'>) {
  return <p className="location-line"><MapPin size={15}/> {city}, {state}</p>;
}
