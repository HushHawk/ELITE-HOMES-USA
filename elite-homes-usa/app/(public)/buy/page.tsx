import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Search } from 'lucide-react';
import { MarketCover, ListingFacts, LocationLine } from '@/components/market-editorial';
import { Eyebrow } from '@/components/editorial';
import { publicListings } from '@/lib/market-store';
import { moneyLabel, marketPropertyTypes } from '@/lib/market-schema';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Buyer Portal', description: 'Browse approved properties and send an offer to Elite Homes USA.' };

export default async function BuyPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q.trim().slice(0,100) : '';
  const type = marketPropertyTypes.find(value => value === params.type) || '';
  const all = await publicListings();
  const listings = all.filter(listing => (!type || listing.propertyType === type) && (!query || [listing.title, listing.city, listing.state, listing.publicAddress].join(' ').toLowerCase().includes(query.toLowerCase())));
  return <><MarketCover kind="buy"/>
    <section className="section light" id="properties"><div className="shell">
      <div className="heading-row"><div><Eyebrow>Approved listings</Eyebrow><h2>Properties to <em>explore.</em></h2></div><span className="listing-count">{listings.length} {listings.length === 1 ? 'property' : 'properties'}</span></div>
      <form className="market-search" action="/buy#properties" method="get">
        <label className="field">Search by title or location<input name="q" defaultValue={query} maxLength={100} placeholder="Jacksonville"/></label>
        <label className="field">Property type<select name="type" defaultValue={type}><option value="">All property types</option>{marketPropertyTypes.map(item => <option key={item}>{item}</option>)}</select></label>
        <button className="btn hero-primary"><Search size={17}/> Search</button>
      </form>
      {listings.length === 0 ? <div className="market-empty">
        <h3>{all.length ? 'No matches for this search.' : 'No properties are listed yet.'}</h3>
        <p>{all.length ? 'Try a different location or property type.' : 'New properties appear here once our team has reviewed and approved them.'}</p>
        <Link href={all.length ? '/buy#properties' : '/contact'} className="text-link">{all.length ? 'Clear filters' : 'Contact our team'} <ArrowUpRight size={16}/></Link>
      </div> : <div className="market-listings">{listings.map(listing => (
        <Link href={'/buy/' + listing.id} className="market-card" key={listing.id}>
          <div className="market-card-photo"><Image src={'/api/media/' + listing.photos[0]} alt={listing.title} fill sizes="(max-width: 650px) 100vw, (max-width: 1000px) 50vw, 33vw"/>
            <span>{listing.status === 'Under contract' ? 'Under contract' : listing.propertyType}</span></div>
          <div className="market-card-copy"><LocationLine city={listing.city} state={listing.state}/><h3>{listing.title}</h3>
            <ListingFacts listing={listing}/><div className="market-card-price"><strong>{listing.asking === null ? 'Inquire for price' : moneyLabel(listing.asking)}</strong><ArrowUpRight size={22}/></div>
          </div>
        </Link>
      ))}</div>}
    </div></section>
  </>;
}
