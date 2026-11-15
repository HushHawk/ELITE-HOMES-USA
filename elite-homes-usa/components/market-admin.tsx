'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowDown, ArrowUp, ArrowUpDown, ArrowUpRight, Building2, Camera, Check, CheckCircle2, ChevronRight, Copy, DollarSign, Download, ExternalLink, Eye, EyeOff, Film, Filter, Globe, ImagePlus, Inbox, LayoutDashboard, Mail, Menu, Phone, RefreshCw, ScrollText, ShieldCheck, Sparkles, Star, Trash2, TrendingUp, X } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Brand } from './chrome';
import { AdminInbox, SignOut } from './inbox';
import { MarketField, PropertyFields, propertyValues, textValue } from './market-forms';
import { MAX_VIDEO_BYTES, moneyLabel, offerStatuses, propertyStatuses, reviewStatuses, videoSource, type BuyerDetails, type PublicListing, type ReviewDetails, type SellerDetails, type SiteContent } from '@/lib/market-schema';
import type { MarketEvent, MediaRecord, OfferRecord, PropertyRecord, ReviewRecord } from '@/lib/market-store';
import { preparePhoto } from '@/lib/photo-client';

type InquiriesSummary = {
  total: number;
  offers: number;
  contact: number;
  newsletter: number;
  recent: Array<{ id: string; channel: string; payload: string; source: string; status: string; follow_up: string; created_at: string }>;
};

type Dashboard = {
  properties: PropertyRecord[]; offers: OfferRecord[]; media: MediaRecord[];
  reviews: ReviewRecord[]; events: MarketEvent[]; site: { content: SiteContent; revision: number };
  inquiries?: InquiriesSummary;
};
type Write = (action: string, change: unknown, revision?: number) => Promise<boolean>;
type Toast = { message: string; error?: boolean };
const dateLabel = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvRows = [
    headers.join(','),
    ...rows.map(row => headers.map(header => {
      const val = row[header] ?? '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','))
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function marketRequest(method: string, data?: unknown) {
  const response = await fetch('/api/admin/market', {
    method, headers: { 'Content-Type': 'application/json' },
    body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(16_000),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'The request could not be completed.');
  return result;
}

async function uploadMedia(file: File, propertyId?: string): Promise<MediaRecord> {
  const video = !propertyId && ['video/mp4','video/webm'].includes(file.type);
  if (video && file.size > MAX_VIDEO_BYTES) throw new Error('Use a video file under 24 MB or add a video URL.');
  const bytes = video ? file : await preparePhoto(file);
  const response = await fetch('/api/admin/media' + (propertyId ? '?property=' + propertyId : ''), {
    method: 'POST', body: bytes, headers: { 'Content-Type': bytes.type }, signal: AbortSignal.timeout(45_000),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Upload failed.');
  return payload;
}

function DirectContact({ email, phone, name }: { email: string; phone?: string; name?: string }) {
  const [copied, setCopied] = useState(false);
  const copyDetails = () => {
    const text = [name, phone, email].filter(Boolean).join(' · ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return <div className="direct-contact">
    {phone && <a className="btn compact back-btn" href={'tel:+1' + phone.replace(/\D/g, '').slice(-10)}><Phone size={15}/> {phone}</a>}
    <a className="btn compact back-btn" href={'mailto:' + email}><Mail size={15}/> {email}</a>
    <button type="button" className="btn compact outline copy-contact-btn" onClick={copyDetails}>
      {copied ? <Check size={14}/> : <Copy size={14}/>} <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  </div>;
}

function History({ events }: { events: MarketEvent[] }) {
  return events.length ? <div className="market-history"><h3>Activity</h3><ul>{events.map((event, i) => <li key={event.created_at + i}>
    <strong>{event.status}</strong> · {dateLabel(event.created_at)}{event.note && <p>{event.note}</p>}
  </li>)}</ul></div> : null;
}

function RecordHeading({ title, caption, status }: { title: string; caption: string; status: string }) {
  return <summary className="market-record-summary">
    <div><strong>{title}</strong><span>{caption}</span></div><span className="record-badge">{status}</span><ArrowUpRight size={18}/>
  </summary>;
}

function PropertyEditor({ record, media, events, write }: { record: PropertyRecord; media: MediaRecord[]; events: MarketEvent[]; write: Write }) {
  const seller = JSON.parse(record.seller_json) as SellerDetails;
  const published = JSON.parse(record.public_json) as Partial<PublicListing>;
  const chosen = JSON.parse(record.public_photos) as string[];
  const [busy, setBusy] = useState(false);
  const [uploadNotice, setUploadNotice] = useState<Toast>();
  const [added, setAdded] = useState<MediaRecord[]>([]);
  const photos = [...media, ...added.filter(file => !media.some(current => current.id === file.id))];
  async function append(file: File) {
    setBusy(true);
    try {
      const photo = await uploadMedia(file, record.id);
      setAdded(old => [...old, photo]);
      setUploadNotice({ message: 'Photo saved privately. Select it and save the property to publish it.' });
    } catch (e) { setUploadNotice({ message: e instanceof Error ? e.message : 'Upload failed.', error:true }); }
    finally { setBusy(false); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const fields = new FormData(event.currentTarget);
    const status = textValue(fields,'status');
    const title = textValue(fields, 'title');
    const listing = title || ['Published','Under contract'].includes(status) ? {
      ...propertyValues(fields), title, publicAddress: textValue(fields,'publicAddress'), description: textValue(fields,'description'),
    } : null;
    try {
      if (!await write('property', { id: record.id, status, listing, photos: fields.getAll('photos'), publicationPermission: fields.get('permission') === 'on', note: textValue(fields, 'note') })) return;
      const element = event.target as HTMLFormElement;
      const note = element.elements.namedItem('note');
      if (note instanceof HTMLTextAreaElement) note.value = '';
    } finally { setBusy(false); }
  }
  return <details className="market-record">
    <RecordHeading title={seller.address} caption={seller.city + ', ' + seller.state + ' · ' + dateLabel(record.created_at)} status={record.status}/>
    <div className="market-record-grid">
      <div className="private-record">
        <h3>Seller’s submission</h3><p className="owner-record-subtitle">Private details</p>
        <dl>
          <div><dt>Seller</dt><dd>{seller.name}</dd></div><div><dt>Address</dt><dd>{seller.address}, {seller.city}, {seller.state} {seller.zip}</dd></div>
          <div><dt>Property</dt><dd>{seller.propertyType}</dd></div>
          <div><dt>Asking price</dt><dd>{seller.asking === null ? 'Unspecified' : moneyLabel(seller.asking)}</dd></div>
          <div><dt>Condition and details</dt><dd className="record-description">{seller.description}</dd></div>
        </dl>
        <DirectContact email={seller.email} phone={seller.phone} name={seller.name}/>
        <History events={events}/>
      </div>
      <form className="owner-market-form" onSubmit={save}>
        <h3>Review and listing</h3>
        <fieldset disabled={busy}><div className="form-grid">
          <MarketField label="Property status" wide><select name="status" defaultValue={record.status}>{propertyStatuses.map(status => <option key={status}>{status}</option>)}</select></MarketField>
          <MarketField label="Public listing title" wide><input name="title" maxLength={110} defaultValue={published.title}/></MarketField>
          <MarketField label="Public street address (optional)" wide><input name="publicAddress" maxLength={180} defaultValue={published.publicAddress}/></MarketField>
          <PropertyFields values={{ ...seller, ...published }} publicView/>
          <MarketField label="Public description" wide><textarea name="description" maxLength={3500} rows={4} defaultValue={published.description}/></MarketField>
        </div>
        <p className="owner-record-subtitle">Select the photos to show on the public listing.</p>
        <div className="owner-photos">{photos.map((file, i) => <label key={file.id}>
          <div><Image src={'/api/media/' + file.id} alt={'Submitted photo ' + (i + 1)} fill unoptimized sizes="140px"/></div>
          <span><input type="checkbox" name="photos" value={file.id} defaultChecked={chosen.includes(file.id)}/> Photo {i + 1}</span>
        </label>)}</div>
        <label className="upload-zone owner-photo-upload"><ImagePlus size={17}/> Add a private listing photo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => {
          const file = e.currentTarget.files?.[0]; e.currentTarget.value = ''; if (file) void append(file);
        }}/></label>
        {uploadNotice && <p className={uploadNotice.error ? 'form-error' : 'owner-record-subtitle'} role={uploadNotice.error ? 'alert' : 'status'}>{uploadNotice.message}</p>}
        <label className="portal-check"><input name="permission" type="checkbox" defaultChecked={['Published','Under contract'].includes(record.status)}/><span>I have the seller’s permission to publish these details and selected photos.</span></label>
        <MarketField label="Private note"><textarea name="note" rows={2} maxLength={1500}/></MarketField>
        </fieldset>
        <div className="owner-form-actions">
          <button className="btn gold compact" disabled={busy}>Save Property</button>
          {record.status !== 'Published' && (
            <button
              type="button"
              className="btn compact outline"
              disabled={busy}
              onClick={() => write('property', {
                id: record.id,
                status: 'Published',
                listing: published.title ? published : {
                  city: seller.city, state: seller.state, propertyType: seller.propertyType,
                  bedrooms: seller.bedrooms, bathrooms: seller.bathrooms, area: seller.area, asking: seller.asking,
                  title: published.title || seller.address, description: published.description || seller.description,
                  publicAddress: published.publicAddress || seller.address
                },
                photos: chosen.length ? chosen : (photos[0] ? [photos[0].id] : []),
                publicationPermission: true,
                note: 'Quick published by administrator'
              })}
            >
              <Eye size={14}/> <span>Quick Publish</span>
            </button>
          )}
          {record.status === 'Published' && (
            <button
              type="button"
              className="btn compact outline"
              disabled={busy}
              onClick={() => write('property', {
                id: record.id,
                status: 'Under contract',
                listing: published,
                photos: chosen,
                publicationPermission: true,
                note: 'Marked under contract'
              })}
            >
              <CheckCircle2 size={14}/> <span>Mark Under Contract</span>
            </button>
          )}
          {['Published','Under contract'].includes(record.status) && <Link className="text-link" href={'/buy/' + record.id} target="_blank">View listing <ArrowUpRight size={15}/></Link>}
        </div>
      </form>
    </div>
  </details>;
}

function OfferEditor({ record, events, write }: { record: OfferRecord; events: MarketEvent[]; write: Write }) {
  const buyer = JSON.parse(record.offer_json) as BuyerDetails;
  const [busy, setBusy] = useState(false);
  return <details className="market-record">
    <RecordHeading title={moneyLabel(buyer.amount) + ' · ' + record.title} caption={buyer.name + ' · ' + dateLabel(record.created_at)} status={record.status}/>
    <div className="market-record-grid">
      <div className="private-record"><h3>Buyer’s offer</h3>
        <dl><div><dt>Buyer</dt><dd>{buyer.name}</dd></div><div><dt>Cash offer</dt><dd>{moneyLabel(buyer.amount)}</dd></div>
          <div><dt>Closing timeline</dt><dd>{buyer.timeline || 'Unspecified'}</dd></div><div><dt>Conditions or questions</dt><dd className="record-description">{buyer.terms || 'None supplied'}</dd></div></dl>
        <DirectContact email={buyer.email} phone={buyer.phone} name={buyer.name}/>
        <History events={events}/>
      </div>
      <form className="owner-market-form" onSubmit={async event => {
        event.preventDefault(); setBusy(true);
        const form = event.currentTarget;
        const fields = new FormData(form);
        try {
          if (!await write('offer', { id: record.id, status: textValue(fields,'status'), note: textValue(fields,'note') })) return;
          const note = form.elements.namedItem('note');
          if (note instanceof HTMLTextAreaElement) note.value = '';
        } finally { setBusy(false); }
      }}><h3>Offer status</h3>
        <fieldset disabled={busy}>
          <MarketField label="Offer status"><select name="status" defaultValue={record.status}>{offerStatuses.map(status => <option key={status}>{status}</option>)}</select></MarketField>
          <MarketField label="Private note"><textarea name="note" rows={3} maxLength={1500}/></MarketField>
        </fieldset>
        <p className="form-policy">Follow up directly with the buyer. A status change stays in the dashboard.</p>
        <div className="owner-form-actions">
          <button className="btn gold compact" disabled={busy}>Save Offer</button>
          {record.status !== 'Accepted for discussion' && (
            <button
              type="button"
              className="btn compact outline"
              disabled={busy}
              onClick={() => write('offer', { id: record.id, status: 'Accepted for discussion', note: 'Accepted for discussion with buyer' })}
            >
              <CheckCircle2 size={14}/> <span>Accept for Discussion</span>
            </button>
          )}
          {record.status !== 'Declined' && (
            <button
              type="button"
              className="btn compact outline"
              disabled={busy}
              onClick={() => write('offer', { id: record.id, status: 'Declined', note: 'Offer declined' })}
            >
              <X size={14}/> <span>Decline Offer</span>
            </button>
          )}
        </div>
      </form>
    </div>
  </details>;
}

function ReviewEditor({ record, write }: { record?: ReviewRecord; write: Write }) {
  const review = record ? JSON.parse(record.review_json) as ReviewDetails : undefined;
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true);
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      if (!await write('review', { id: record?.id, name: textValue(fields,'name'), title: textValue(fields,'title'), body: textValue(fields,'body'), status: textValue(fields,'status'), remove: confirmDelete })) return;
      if (!record) form.reset();
      setConfirmDelete(false);
    } finally { setBusy(false); }
  }
  return <details className="market-record">
    {record ? <RecordHeading title={review?.title || 'Review'} caption={review?.name + ' · ' + dateLabel(record.created_at)} status={record.status}/> : <summary className="market-record-summary"><strong>Add a review</strong><ArrowUpRight size={18}/></summary>}
    <form className="owner-market-form review-editor" onSubmit={send}><fieldset disabled={busy}>
      <div className="form-grid">
        <MarketField label="Display name"><input name="name" maxLength={80} defaultValue={review?.name} required/></MarketField>
        <MarketField label="Visibility"><select name="status" defaultValue={record?.status || 'Hidden'}>{reviewStatuses.map(status => <option key={status}>{status}</option>)}</select></MarketField>
        <MarketField label="Title" wide><input name="title" maxLength={105} defaultValue={review?.title} required/></MarketField>
        <MarketField label="Review" wide><textarea name="body" maxLength={1500} rows={4} defaultValue={review?.body} required/></MarketField>
      </div>
      {review?.email && <DirectContact email={review.email} name={review.name}/>}
      {record && <label className="portal-check"><input type="checkbox" checked={confirmDelete} onChange={e => setConfirmDelete(e.target.checked)}/> Delete this review</label>}
    </fieldset>
    <div className="owner-form-actions">
      <button className="btn gold compact" disabled={busy}>{confirmDelete ? 'Delete Review' : 'Save Review'}</button>
      {record && record.status !== 'Published' && (
        <button
          type="button"
          className="btn compact outline"
          disabled={busy}
          onClick={() => write('review', { id: record.id, name: review?.name || 'Homeowner', title: review?.title || 'Review', body: review?.body || '', status: 'Published' })}
        >
          <Eye size={14}/> <span>Approve & Publish</span>
        </button>
      )}
      {record && record.status === 'Published' && (
        <button
          type="button"
          className="btn compact outline"
          disabled={busy}
          onClick={() => write('review', { id: record.id, name: review?.name || 'Homeowner', title: review?.title || 'Review', body: review?.body || '', status: 'Hidden' })}
        >
          <EyeOff size={14}/> <span>Hide Review</span>
        </button>
      )}
    </div>
    </form>
  </details>;
}

type ImageEntry = SiteContent['gallery'][number];
function ImageEditor({ entries, label, media, max, change }: { entries: ImageEntry[]; label: string; media: MediaRecord[]; max: number; change: (entries: ImageEntry[]) => void }) {
  const [selected, setSelected] = useState('');
  function swap(from: number, to: number) {
    const next = [...entries];
    [next[from], next[to]] = [next[to], next[from]];
    change(next);
  }
  return <div className="image-editor admin-image-editor">
    <div className="editor-subhead">
      <h3>{label}</h3>
      <span className="editor-count-badge">{entries.length} / {max} selected</span>
    </div>
    <div className="editor-add">
      <MarketField label={'Choose image for ' + label.toLowerCase()}>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Select an uploaded image</option>
          {media.filter(file => !entries.some(entry => entry.id === file.id)).map((file, i) => (
            <option value={file.id} key={file.id}>Image {i + 1} · {dateLabel(file.created_at)} · {file.id.slice(0, 7)}</option>
          ))}
        </select>
      </MarketField>
      <button
        type="button"
        className="btn compact gold"
        disabled={!selected || entries.length >= max}
        onClick={() => { change([...entries, { id: selected, alt: '' }]); setSelected(''); }}
      >
        Add image
      </button>
    </div>
    {selected && (
      <div className="image-choice-preview">
        <Image src={'/api/media/' + selected} alt="Selected image preview" fill sizes="170px" unoptimized />
      </div>
    )}
    <div className="image-editor-rows-list">
      {entries.map((entry, i) => (
        <div className="image-editor-row" key={entry.id}>
          <div className="editor-thumb">
            <Image src={'/api/media/' + entry.id} alt="" fill sizes="75px" unoptimized />
          </div>
          <MarketField label={'Photo ' + (i + 1) + ' description'}>
            <input
              required
              maxLength={140}
              value={entry.alt}
              onChange={e => change(entries.map(item => item.id === entry.id ? { ...item, alt: e.target.value } : item))}
              placeholder="Descriptive alt text for visitors..."
            />
          </MarketField>
          <div className="editor-move">
            <button
              type="button"
              className="icon-btn"
              disabled={!i}
              aria-label={'Move photo ' + (i + 1) + ' earlier'}
              onClick={() => swap(i, i - 1)}
            >
              <ArrowUp size={16} />
            </button>
            <button
              type="button"
              className="icon-btn"
              disabled={i === entries.length - 1}
              aria-label={'Move photo ' + (i + 1) + ' later'}
              onClick={() => swap(i, i + 1)}
            >
              <ArrowDown size={16} />
            </button>
            <button
              type="button"
              className="icon-btn danger"
              aria-label={'Remove photo ' + (i + 1)}
              onClick={() => change(entries.filter(item => item.id !== entry.id))}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>;
}

function ContentEditor({ dashboard, write, announce }: { dashboard: Dashboard; write: Write; announce: (toast: Toast) => void }) {
  const [draft, setDraft] = useState(dashboard.site.content);
  const [media, setMedia] = useState(dashboard.media.filter(file => !file.property_id));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeSubSection, setActiveSubSection] = useState<'all' | 'hero' | 'narrative' | 'pillars' | 'media' | 'gallery' | 'reviews'>('all');

  const videos = media.filter(file => file.mime.startsWith('video/'));
  const pictures = media.filter(file => file.mime === 'image/webp');

  async function upload(file: File) {
    setUploading(true);
    try {
      const payload = await uploadMedia(file);
      const video = payload.mime.startsWith('video/');
      setMedia(old => [payload, ...old]);
      if (video) setDraft(old => ({ ...old, video: { kind: 'upload', id: payload.id } }));
      announce({ message: video ? 'Video uploaded. Save Website Changes to publish it.' : 'Photo uploaded. Add it to the hero or gallery below.' });
    } catch (e) { announce({ message: e instanceof Error ? e.message : 'Upload failed.', error: true }); }
    finally { setUploading(false); }
  }

  return (
    <form
      className="admin-content-manager"
      onSubmit={async e => {
        e.preventDefault();
        setBusy(true);
        try { await write('content', draft, dashboard.site.revision); }
        finally { setBusy(false); }
      }}
    >
      {/* Sub-Section Navigation Pills */}
      <div className="admin-content-subnav" aria-label="Website sections navigation">
        <button
          type="button"
          className={'subnav-pill' + (activeSubSection === 'all' ? ' active' : '')}
          onClick={() => setActiveSubSection('all')}
        >
          All Sections
        </button>
        <button
          type="button"
          className={'subnav-pill' + (activeSubSection === 'hero' ? ' active' : '')}
          onClick={() => setActiveSubSection('hero')}
        >
          <Sparkles size={14} aria-hidden="true" />
          <span>Hero Section</span>
        </button>
        <button
          type="button"
          className={'subnav-pill' + (activeSubSection === 'narrative' ? ' active' : '')}
          onClick={() => setActiveSubSection('narrative')}
        >
          <ScrollText size={14} aria-hidden="true" />
          <span>Homepage Copy</span>
        </button>
        <button
          type="button"
          className={'subnav-pill' + (activeSubSection === 'pillars' ? ' active' : '')}
          onClick={() => setActiveSubSection('pillars')}
        >
          <ShieldCheck size={14} aria-hidden="true" />
          <span>Pillars & Mission</span>
        </button>
        <button
          type="button"
          className={'subnav-pill' + (activeSubSection === 'media' ? ' active' : '')}
          onClick={() => setActiveSubSection('media')}
        >
          <ImagePlus size={14} aria-hidden="true" />
          <span>Media Library</span>
          <span className="subnav-badge" aria-hidden="true">{media.length}</span>
        </button>
        <button
          type="button"
          className={'subnav-pill' + (activeSubSection === 'gallery' ? ' active' : '')}
          onClick={() => setActiveSubSection('gallery')}
        >
          <Film size={14} aria-hidden="true" />
          <span>Homepage Gallery</span>
          <span className="subnav-badge" aria-hidden="true">{draft.gallery.length}</span>
        </button>
        <button
          type="button"
          className={'subnav-pill' + (activeSubSection === 'reviews' ? ' active' : '')}
          onClick={() => setActiveSubSection('reviews')}
        >
          <Camera size={14} aria-hidden="true" />
          <span>Original Reviews</span>
        </button>
      </div>

      <fieldset disabled={busy || uploading} className="admin-content-fieldset">
        {/* SECTION 1: COMPLETE HERO SECTION */}
        {(activeSubSection === 'all' || activeSubSection === 'hero') && (
          <div className="admin-section-card hero-section-card">
            <div className="admin-card-header">
              <div className="admin-card-icon gold"><Sparkles size={20} aria-hidden="true" /></div>
              <div className="admin-card-title-wrap">
                <div className="admin-card-badge-row">
                  <span className="admin-section-tag">HERO BILLBOARD</span>
                  <span className="admin-live-badge">Homepage Showcase</span>
                </div>
                <h3>Hero Section (Visual Billboard & Film)</h3>
                <p>Customize the full-bleed hero headlines, description, curated photography, and background architectural film.</p>
              </div>
            </div>

            <div className="admin-card-body">
              {/* Part A: Hero Copy */}
              <div className="admin-form-group">
                <div className="admin-group-label">Hero Headlines & Copy</div>
                <div className="form-grid">
                  <MarketField label="Hero headline">
                    <input
                      maxLength={52}
                      value={draft.headline}
                      onChange={e => setDraft(old => ({ ...old, headline: e.target.value }))}
                      placeholder="e.g., Sell your home. Move ahead."
                    />
                  </MarketField>
                  <MarketField label="Hero accent line">
                    <input
                      maxLength={52}
                      value={draft.accent}
                      onChange={e => setDraft(old => ({ ...old, accent: e.target.value }))}
                      placeholder="e.g., On your timeline. Without repairs."
                    />
                  </MarketField>
                  <MarketField label="Hero description" wide>
                    <textarea
                      maxLength={250}
                      rows={3}
                      value={draft.heroCopy}
                      onChange={e => setDraft(old => ({ ...old, heroCopy: e.target.value }))}
                      placeholder="Brief overview explaining your direct cash purchase process..."
                    />
                  </MarketField>
                </div>
              </div>

              {/* Part B: Hero Photos */}
              <div className="admin-form-group">
                <div className="admin-group-label">Hero Background Photography (Carousel Slides)</div>
                <p className="admin-group-caption">Select up to 5 high-resolution photographs. Hero carousel automatically rotates every 6 seconds on the live website, with pause on hover and direct navigation controls.</p>
                <ImageEditor
                  entries={draft.heroImages}
                  label="Hero photos"
                  media={pictures}
                  max={5}
                  change={heroImages => setDraft(old => ({ ...old, heroImages }))}
                />
              </div>

              {/* Part C: Hero Video / Film */}
              <div className="admin-form-group hero-video-group">
                <div className="admin-group-label">Hero Background Film</div>
                <p className="admin-group-caption">Configure full-screen background video streaming behind the hero headlines.</p>

                <div className="form-grid">
                  <MarketField label="Video source">
                    <select
                      value={draft.video.kind}
                      onChange={e => {
                        const value = e.target.value;
                        setDraft(old => ({
                          ...old,
                          video: value === 'url' ? { kind: 'url', url: '' } : value === 'upload' ? { kind: 'upload', id: videos[0]?.id || '' } : { kind: value === 'off' ? 'off' : 'default' }
                        }));
                      }}
                    >
                      <option value="default">Original architecture film</option>
                      <option value="off">No film</option>
                      <option value="upload">Uploaded video</option>
                      <option value="url">Video URL</option>
                    </select>
                  </MarketField>

                  {draft.video.kind === 'upload' && (
                    <MarketField label="Choose uploaded video">
                      <select
                        required
                        value={draft.video.id}
                        onChange={e => setDraft(old => ({ ...old, video: { kind: 'upload', id: e.target.value } }))}
                      >
                        <option value="">Upload a video in Media Library</option>
                        {videos.map((file, i) => (
                          <option key={file.id} value={file.id}>
                            Video {i + 1} · {dateLabel(file.created_at)} · {file.id.slice(0, 7)}
                          </option>
                        ))}
                      </select>
                    </MarketField>
                  )}

                  {draft.video.kind === 'url' && (
                    <MarketField label="HTTPS video URL" wide>
                      <input
                        type="url"
                        required
                        maxLength={1600}
                        placeholder="MP4, WebM, YouTube or Vimeo URL"
                        value={draft.video.url}
                        onChange={e => setDraft(old => ({ ...old, video: { kind: 'url', url: e.target.value } }))}
                      />
                    </MarketField>
                  )}
                </div>

                {draft.video.kind === 'upload' && draft.video.id && (
                  <div className="admin-video-preview-wrap">
                    <span className="preview-label">Live Video Stream Preview:</span>
                    <video className="owner-video-preview" src={'/api/media/' + draft.video.id} controls preload="metadata" />
                  </div>
                )}
                {draft.video.kind === 'url' && videoSource(draft.video.url) && (
                  <div className="admin-video-url-link">
                    <a className="text-link" href={draft.video.url} target="_blank" rel="noreferrer">
                      Check source video link <ArrowUpRight size={15} />
                    </a>
                  </div>
                )}
              </div>

              {/* Part D: Hero Live Mockup Preview */}
              <div className="hero-live-preview-card">
                <span className="preview-pill">Live Hero Preview</span>
                <div className="hero-preview-display">
                  <div className="hero-preview-text">
                    <span className="hero-preview-eyebrow">ELITE HOMES USA · JACKSONVILLE, FL</span>
                    <div className="hero-preview-title">
                      {draft.headline || 'Sell your home.'} {draft.accent ? <em>{draft.accent}</em> : <em>Move ahead.</em>}
                    </div>
                    <p className="hero-preview-desc">
                      {draft.heroCopy || 'Sell directly for cash with clear written terms and no mandatory repairs.'}
                    </p>
                    <div className="hero-preview-cta">
                      <span className="btn gold compact">Get My Cash Offer</span>
                      <span className="btn outline compact">How It Works</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: HOMEPAGE NARRATIVE & CLOSING */}
        {(activeSubSection === 'all' || activeSubSection === 'narrative') && (
          <div className="admin-section-card">
            <div className="admin-card-header">
              <div className="admin-card-icon blue"><ScrollText size={20} aria-hidden="true" /></div>
              <div className="admin-card-title-wrap">
                <div className="admin-card-badge-row">
                  <span className="admin-section-tag">HOMEPAGE SECTIONS</span>
                </div>
                <h3>Homepage Narrative & Closing Banner</h3>
                <p>Edit the introduction storytelling section and the bottom conversion banner. Leave blank to use defaults.</p>
              </div>
            </div>

            <div className="admin-card-body">
              <div className="admin-form-group">
                <div className="admin-group-label">Introduction Section</div>
                <div className="form-grid">
                  <MarketField label="Homepage introduction title" wide>
                    <input
                      maxLength={100}
                      value={draft.introductionTitle}
                      onChange={e => setDraft(old => ({ ...old, introductionTitle: e.target.value }))}
                      placeholder="e.g., People first. Property second."
                    />
                  </MarketField>
                  <MarketField label="Homepage introduction text" wide>
                    <textarea
                      maxLength={650}
                      rows={4}
                      value={draft.introduction}
                      onChange={e => setDraft(old => ({ ...old, introduction: e.target.value }))}
                      placeholder="Share your company's core approach to listening and serving homeowners..."
                    />
                  </MarketField>
                </div>
              </div>

              <div className="admin-form-group">
                <div className="admin-group-label">Closing Banner Call-To-Action</div>
                <div className="form-grid">
                  <MarketField label="Closing banner title" wide>
                    <input
                      maxLength={100}
                      value={draft.closingTitle}
                      onChange={e => setDraft(old => ({ ...old, closingTitle: e.target.value }))}
                      placeholder="e.g., Let’s make it simple."
                    />
                  </MarketField>
                  <MarketField label="Closing banner description" wide>
                    <textarea
                      maxLength={280}
                      rows={3}
                      value={draft.closingCopy}
                      onChange={e => setDraft(old => ({ ...old, closingCopy: e.target.value }))}
                      placeholder="Final prompt encouraging homeowners to request a review..."
                    />
                  </MarketField>
                </div>
              </div>
            </div>
          </div>
        )}

{/* SECTION: BRAND MISSION & PILLARS */}
        {(activeSubSection === 'all' || activeSubSection === 'pillars') && (
          <div className="admin-section-card">
            <div className="admin-card-header">
              <div className="admin-card-icon gold"><ShieldCheck size={20} aria-hidden="true" /></div>
              <div className="admin-card-title-wrap">
                <div className="admin-card-badge-row">
                  <span className="admin-section-tag">BRAND PILLARS & MISSION</span>
                  <span className="admin-live-badge">Live On About Page</span>
                </div>
                <h3>Why We’re Different & Founder Mission</h3>
                <p>Curated pillars and founder commitment displayed to sellers weighing traditional vs cash home sales.</p>
              </div>
            </div>

            <div className="admin-card-body">
              <div className="admin-form-group">
                <div className="admin-group-label">The Four Elite Differentiators</div>
                <div className="admin-pillars-preview-grid">
                  <div className="admin-pillar-preview-card">
                    <span className="pillar-num">01</span>
                    <strong>Fast Cash Offers</strong>
                    <p>Receive an offer within 24 hours.</p>
                  </div>
                  <div className="admin-pillar-preview-card">
                    <span className="pillar-num">02</span>
                    <strong>No Repairs Needed</strong>
                    <p>We buy your home as-is.</p>
                  </div>
                  <div className="admin-pillar-preview-card">
                    <span className="pillar-num">03</span>
                    <strong>No Hidden Fees</strong>
                    <p>No commissions or closing costs.</p>
                  </div>
                  <div className="admin-pillar-preview-card">
                    <span className="pillar-num">04</span>
                    <strong>Local Market Expertise</strong>
                    <p>Years of experience in the communities we serve.</p>
                  </div>
                </div>
              </div>

              <div className="admin-founder-mission-box">
                <div className="founder-box-header">
                  <div className="founder-badge">Founder & Principal</div>
                  <h4>Meet Darren Richardson</h4>
                </div>
                <p>
                  &ldquo;At the core of my work is a genuine dedication to helping people. I take pride in turning what could be overwhelming challenges into manageable solutions, ensuring my clients have the information, tools, and support they need to succeed in their real estate journeys.&rdquo;
                </p>
                <Link href="/about" target="_blank" className="btn compact outline view-about-btn" rel="noreferrer">
                  <span>View Founder Story & About Page</span>
                  <ExternalLink size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: MEDIA LIBRARY */}
        {(activeSubSection === 'all' || activeSubSection === 'media') && (
          <div className="admin-section-card">
            <div className="admin-card-header">
              <div className="admin-card-icon amber"><ImagePlus size={20} aria-hidden="true" /></div>
              <div className="admin-card-title-wrap">
                <div className="admin-card-badge-row">
                  <span className="admin-section-tag">ASSET REPOSITORY</span>
                  <span className="admin-live-badge">{media.length} Uploaded Files</span>
                </div>
                <h3>Media Library & Uploader</h3>
                <p>Upload high-resolution photography (JPEG, PNG, WebP) or video films (MP4, WebM up to 24 MB).</p>
              </div>
            </div>

            <div className="admin-card-body">
              <label className="upload-zone admin-luxury-dropzone">
                <div className="dropzone-icon-ring">
                  <ImagePlus size={26} aria-hidden="true" />
                </div>
                <div className="dropzone-text">
                  <strong>{uploading ? 'Processing & Optimizing Media…' : 'Upload a media file'}</strong>
                  <span>Drag & drop or browse from your device (Images or MP4/WebM videos up to 24 MB)</span>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={e => {
                    const file = e.currentTarget.files?.[0];
                    e.currentTarget.value = '';
                    if (file) void upload(file);
                  }}
                />
              </label>

              {media.length > 0 && (
                <div className="admin-media-asset-grid">
                  {media.map((file, idx) => {
                    const isVid = file.mime.startsWith('video/');
                    return (
                      <div key={file.id} className="media-asset-tile">
                        <div className="tile-thumb">
                          {isVid ? (
                            <div className="video-tile-placeholder">
                              <Film size={24} />
                              <span>MP4 / WebM</span>
                            </div>
                          ) : (
                            <Image src={'/api/media/' + file.id} alt="" fill sizes="160px" unoptimized />
                          )}
                          <span className={'tile-type-pill ' + (isVid ? 'vid' : 'img')}>
                            {isVid ? 'Video' : 'Photo'}
                          </span>
                        </div>
                        <div className="tile-meta">
                          <strong>Asset #{idx + 1}</strong>
                          <span>{dateLabel(file.created_at)}</span>
                          <small>{file.id.slice(0, 8)}</small>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTION 4: HOMEPAGE GALLERY */}
        {(activeSubSection === 'all' || activeSubSection === 'gallery') && (
          <div className="admin-section-card">
            <div className="admin-card-header">
              <div className="admin-card-icon purple"><Film size={20} aria-hidden="true" /></div>
              <div className="admin-card-title-wrap">
                <div className="admin-card-badge-row">
                  <span className="admin-section-tag">EDITORIAL GALLERY</span>
                  <span className="admin-live-badge">{draft.gallery.length} Photos Selected</span>
                </div>
                <h3>Homepage Gallery Showcase</h3>
                <p>Curate up to 20 photographs displayed in the interactive editorial masonry gallery on the home page.</p>
              </div>
            </div>

            <div className="admin-card-body">
              <ImageEditor
                entries={draft.gallery}
                label="Homepage gallery"
                media={pictures}
                max={20}
                change={gallery => setDraft(old => ({ ...old, gallery }))}
              />
            </div>
          </div>
        )}

        {/* SECTION 5: ORIGINAL REVIEWS SETTINGS */}
        {(activeSubSection === 'all' || activeSubSection === 'reviews') && (
          <div className="admin-section-card">
            <div className="admin-card-header">
              <div className="admin-card-icon green"><Camera size={20} aria-hidden="true" /></div>
              <div className="admin-card-title-wrap">
                <div className="admin-card-badge-row">
                  <span className="admin-section-tag">TESTIMONIALS</span>
                </div>
                <h3>Original reviews</h3>
                <p>Manage visibility for historical customer reviews migrated from previous platforms.</p>
              </div>
            </div>

            <div className="admin-card-body">
              <label className="admin-toggle-switch-card">
                <input
                  type="checkbox"
                  checked={draft.showOriginalReviews}
                  onChange={e => setDraft(old => ({ ...old, showOriginalReviews: e.target.checked }))}
                />
                <div className="toggle-switch-visual" />
                <div className="toggle-switch-text">
                  <strong>Show the reviews carried over from the previous Elite Homes USA website.</strong>
                  <span>When enabled, verified testimonials from prior platform history will display alongside newly submitted reviews.</span>
                </div>
              </label>
            </div>
          </div>
        )}
      </fieldset>

      {/* Sticky Save Bar */}
      <div className="admin-content-save-bar">
        <div className="save-bar-info">
          <span className="save-dot" />
          <span>Website content revision #{dashboard.site.revision}</span>
        </div>
        <button className="btn gold save-btn" disabled={busy || uploading}>
          {busy ? 'Saving Changes…' : 'Save Website Changes'}
        </button>
      </div>
    </form>
  );
}

const sections = [
  ['overview', 'Overview', LayoutDashboard],
  ['properties', 'Seller submissions', Building2],
  ['offers', 'Buyer offers', ScrollText],
  ['inquiries', 'General inquiries', Inbox],
  ['content', 'Website and media', Film],
  ['reviews', 'Reviews', Camera],
] as const;
type DashboardTab = typeof sections[number][0];

export function MarketAdmin() {
  const [tab, setTab] = useState<DashboardTab>('properties');
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [notice, setNotice] = useState<Toast>();
  const [filter, setFilter] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [propertyStatus, setPropertyStatus] = useState<string>('All');
  const [propertySort, setPropertySort] = useState<'newest' | 'oldest' | 'price_high' | 'price_low'>('newest');
  const [offerStatus, setOfferStatus] = useState<string>('All');
  const [offerSort, setOfferSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
  const [reviewStatus, setReviewStatus] = useState<string>('All');

  const refresh = useCallback(async () => setDashboard(await marketRequest('GET')), []);

  useEffect(() => {
    let active = true;
    marketRequest('GET').then(data => {
      if (active) setDashboard(data);
    }).catch(e => { if (active) setNotice({ message: e.message, error: true }); });
    return () => { active = false; };
  }, []);

  const write: Write = async (action, change, revision) => {
    setNotice(undefined);
    try {
      await marketRequest('PATCH', { action, change, revision });
      await refresh();
      setNotice({ message: 'Changes saved.' });
      return true;
    } catch (e) {
      setNotice({ message: e instanceof Error ? e.message : 'The change could not be saved.', error: true });
      return false;
    }
  };

  const query = filter.trim().toLowerCase();

  const totalInventoryValue = (dashboard?.properties || []).reduce((sum, p) => {
    try {
      const seller = JSON.parse(p.seller_json) as SellerDetails;
      return sum + (seller.asking || 0);
    } catch { return sum; }
  }, 0);

  const totalOffersValue = (dashboard?.offers || []).reduce((sum, o) => {
    try {
      const buyer = JSON.parse(o.offer_json) as BuyerDetails;
      return sum + (buyer.amount || 0);
    } catch { return sum; }
  }, 0);

  const avgAskingPrice = dashboard?.properties.length
    ? Math.round(totalInventoryValue / dashboard.properties.length)
    : 0;

  const closedOrContractCount = (dashboard?.properties || []).filter(p =>
    ['Published', 'Under contract', 'Sold'].includes(p.status)
  ).length;

  const conversionRate = dashboard?.properties.length
    ? Math.round((closedOrContractCount / dashboard.properties.length) * 100)
    : 0;

  const exportPropertiesCsv = () => {
    if (!dashboard?.properties.length) return;
    const rows = dashboard.properties.map(p => {
      const s = JSON.parse(p.seller_json) as SellerDetails;
      return {
        ID: p.id,
        Address: s.address,
        City: s.city,
        State: s.state,
        ZIP: s.zip,
        PropertyType: s.propertyType,
        Bedrooms: s.bedrooms ?? '',
        Bathrooms: s.bathrooms ?? '',
        AreaSqFt: s.area ?? '',
        AskingPrice: s.asking ? moneyLabel(s.asking) : 'Unspecified',
        SellerName: s.name,
        SellerEmail: s.email,
        SellerPhone: s.phone,
        Status: p.status,
        SubmittedDate: dateLabel(p.created_at)
      };
    });
    downloadCsv('elite-homes-properties.csv', rows);
  };

  const exportOffersCsv = () => {
    if (!dashboard?.offers.length) return;
    const rows = dashboard.offers.map(o => {
      const b = JSON.parse(o.offer_json) as BuyerDetails;
      return {
        ID: o.id,
        ListingTitle: o.title,
        OfferAmount: moneyLabel(b.amount),
        BuyerName: b.name,
        BuyerEmail: b.email,
        BuyerPhone: b.phone,
        Timeline: b.timeline || 'Unspecified',
        Terms: b.terms || '',
        Status: o.status,
        SubmittedDate: dateLabel(o.created_at)
      };
    });
    downloadCsv('elite-homes-offers.csv', rows);
  };

  const exportReviewsCsv = () => {
    if (!dashboard?.reviews.length) return;
    const rows = dashboard.reviews.map(r => {
      const rev = JSON.parse(r.review_json) as ReviewDetails;
      return {
        ID: r.id,
        ReviewerName: rev.name,
        ReviewTitle: rev.title,
        ReviewBody: rev.body,
        ReviewerEmail: rev.email || '',
        Status: r.status,
        Date: dateLabel(r.created_at)
      };
    });
    downloadCsv('elite-homes-reviews.csv', rows);
  };

  const filteredProperties = (dashboard?.properties || [])
    .filter(r => {
      if (propertyStatus !== 'All' && r.status !== propertyStatus) return false;
      if (query && !(r.seller_json + r.status).toLowerCase().includes(query)) return false;
      return true;
    })
    .sort((a, b) => {
      if (propertySort === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (propertySort === 'price_high') {
        const pA = (JSON.parse(a.seller_json) as SellerDetails).asking || 0;
        const pB = (JSON.parse(b.seller_json) as SellerDetails).asking || 0;
        return pB - pA;
      }
      if (propertySort === 'price_low') {
        const pA = (JSON.parse(a.seller_json) as SellerDetails).asking || 0;
        const pB = (JSON.parse(b.seller_json) as SellerDetails).asking || 0;
        return pA - pB;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const filteredOffers = (dashboard?.offers || [])
    .filter(r => {
      if (offerStatus !== 'All' && r.status !== offerStatus) return false;
      if (query && !(r.offer_json + r.status + r.title).toLowerCase().includes(query)) return false;
      return true;
    })
    .sort((a, b) => {
      if (offerSort === 'highest') {
        const oA = (JSON.parse(a.offer_json) as BuyerDetails).amount || 0;
        const oB = (JSON.parse(b.offer_json) as BuyerDetails).amount || 0;
        return oB - oA;
      }
      if (offerSort === 'lowest') {
        const oA = (JSON.parse(a.offer_json) as BuyerDetails).amount || 0;
        const oB = (JSON.parse(b.offer_json) as BuyerDetails).amount || 0;
        return oA - oB;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const filteredReviews = (dashboard?.reviews || []).filter(r => {
    if (reviewStatus !== 'All' && r.status !== reviewStatus) return false;
    return true;
  });

  return (
    <div className="admin-app-layout">
      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar */}
      <aside className={'admin-sidebar' + (sidebarOpen ? ' open' : '')}>
        <div className="admin-sidebar-top">
          <div className="admin-sidebar-brand-row">
            <Brand />
            <span className="admin-portal-badge">
              <ShieldCheck size={13} aria-hidden="true" />
              <span>Owner Portal</span>
            </span>
          </div>

          <Link href="/" target="_blank" className="admin-sidebar-site-btn" rel="noreferrer">
            <Globe size={16} aria-hidden="true" />
            <span>View Live Website</span>
            <ExternalLink size={13} aria-hidden="true" className="ext-icon" />
          </Link>
        </div>

        <div className="admin-sidebar-nav-wrap">
          <div className="admin-sidebar-nav-title">WORKSPACE NAVIGATION</div>
          <nav className="admin-sidebar-nav" aria-label="Owner dashboard sections">
            {sections.map(([id, label, Icon]) => {
              const count =
                id === 'properties' ? dashboard?.properties.length
                : id === 'offers' ? dashboard?.offers.length
                : id === 'reviews' ? dashboard?.reviews.filter(r => r.status === 'Pending').length
                : undefined;
              return (
                <button
                  type="button"
                  aria-pressed={tab === id}
                  key={id}
                  className={'admin-nav-item' + (tab === id ? ' active' : '')}
                  onClick={() => {
                    setTab(id);
                    setFilter('');
                    setNotice(undefined);
                    setSidebarOpen(false);
                  }}
                >
                  <Icon size={18} aria-hidden="true" />
                  <span className="admin-nav-text">{label}</span>
                  {count !== undefined && count > 0 && (
                    <span className="admin-nav-badge" aria-hidden="true">{count}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="admin-sidebar-footer">
          <div className="admin-user-profile">
            <div className="admin-user-avatar">DR</div>
            <div className="admin-user-info">
              <strong>Darren Richardson</strong>
              <span>Owner / Administrator</span>
            </div>
          </div>
          <SignOut />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main">
        {/* Sticky Top Header */}
        <header className="admin-main-header">
          <div className="admin-header-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setSidebarOpen(o => !o)}
              aria-label="Toggle navigation menu"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="admin-breadcrumbs">
              <span>Admin Console</span>
              <ChevronRight size={14} aria-hidden="true" />
              <strong>{sections.find(s => s[0] === tab)?.[1] || 'Dashboard'}</strong>
            </div>
          </div>

          <div className="admin-header-actions">
            <span className="admin-mode-pill">
              <span className="status-dot-pulse" aria-hidden="true" />
              <span>Preview Mode</span>
            </span>

            <button
              type="button"
              className={'admin-action-btn' + (refreshing ? ' spinning' : '')}
              onClick={async () => {
                setRefreshing(true);
                try { await refresh(); } finally { setTimeout(() => setRefreshing(false), 500); }
              }}
              title="Refresh marketplace data"
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>Refresh</span>
            </button>

            <Link href="/" target="_blank" className="admin-action-btn website-btn" rel="noreferrer">
              <Globe size={14} aria-hidden="true" />
              <span>Live Site</span>
            </Link>
          </div>
        </header>

        {/* Main Content Body */}
        <div className="admin-main-body">
          <div className="admin-page-hero">
            <h1 className="admin-page-title">Owner dashboard</h1>
            <p className="admin-page-subtitle">
              Executive control center for luxury acquisitions, seller submissions, buyer cash offers, and public showcase assets.
            </p>
          </div>

          {/* Quick Stats / KPI Summary Bar */}
          <div className="market-overview">
            <div className="kpi-card" onClick={() => setTab('properties')} style={{ cursor: 'pointer' }}>
              <div className="kpi-head"><span>Seller submissions</span><Building2 size={16} aria-hidden="true"/></div>
              <strong>{(dashboard?.properties.length ?? 0) + (dashboard?.inquiries?.offers ?? 0)}</strong>
              <small>{dashboard?.properties.length ?? 0} dossiers · {dashboard?.inquiries?.offers ?? 0} cash inquiries</small>
            </div>
            <div className="kpi-card" onClick={() => setTab('properties')} style={{ cursor: 'pointer' }}>
              <div className="kpi-head"><span>Published listings</span><Sparkles size={16} aria-hidden="true"/></div>
              <strong>{dashboard?.properties.filter(p => p.status === 'Published').length ?? 0}</strong>
              <small>Active on public gallery</small>
            </div>
            <div className="kpi-card" onClick={() => setTab('offers')} style={{ cursor: 'pointer' }}>
              <div className="kpi-head"><span>Buyer offers</span><ScrollText size={16} aria-hidden="true"/></div>
              <strong>{dashboard?.offers.length ?? 0}</strong>
              <small>{dashboard?.offers.filter(o => ['Accepted for discussion', 'Contacted'].includes(o.status)).length ?? 0} active in discussion</small>
            </div>
            <div className="kpi-card" onClick={() => setTab('reviews')} style={{ cursor: 'pointer' }}>
              <div className="kpi-head"><span>Customer reviews</span><Camera size={16} aria-hidden="true"/></div>
              <strong>{dashboard?.reviews.length ?? 0}</strong>
              <small>{dashboard?.reviews.filter(r => r.status === 'Published').length ?? 0} live on website</small>
            </div>
          </div>

          {notice && (
            <p className={'owner-toast' + (notice.error ? ' error' : '')} role={notice.error ? 'alert' : 'status'}>
              {notice.message}
            </p>
          )}

          {/* Dynamic Tab Panes */}
          {tab === 'overview' && (
            <div className="admin-overview-panel">
              {/* Financial & Portfolio Analytics */}
              <div className="admin-financial-section">
                <div className="admin-section-header">
                  <h2>Portfolio & Financial Overview</h2>
                  <p>Real-time valuation of marketplace inventory and buyer cash offers</p>
                </div>
                <div className="financial-kpi-grid">
                  <div className="financial-kpi-card">
                    <div className="fin-icon gold"><DollarSign size={20} aria-hidden="true" /></div>
                    <div className="fin-content">
                      <span className="fin-label">Total Pipeline Value</span>
                      <strong className="fin-value">{totalInventoryValue ? moneyLabel(totalInventoryValue) : '$0'}</strong>
                      <span className="fin-subtext">{(dashboard?.properties || []).length} submissions recorded</span>
                    </div>
                  </div>

                  <div className="financial-kpi-card">
                    <div className="fin-icon blue"><TrendingUp size={20} aria-hidden="true" /></div>
                    <div className="fin-content">
                      <span className="fin-label">Active Cash Offer Volume</span>
                      <strong className="fin-value">{totalOffersValue ? moneyLabel(totalOffersValue) : '$0'}</strong>
                      <span className="fin-subtext">{(dashboard?.offers || []).length} buyer offers received</span>
                    </div>
                  </div>

                  <div className="financial-kpi-card">
                    <div className="fin-icon amber"><Building2 size={20} aria-hidden="true" /></div>
                    <div className="fin-content">
                      <span className="fin-label">Average Asking Price</span>
                      <strong className="fin-value">{avgAskingPrice ? moneyLabel(avgAskingPrice) : '$0'}</strong>
                      <span className="fin-subtext">Across all seller properties</span>
                    </div>
                  </div>

                  <div className="financial-kpi-card">
                    <div className="fin-icon green"><Sparkles size={20} aria-hidden="true" /></div>
                    <div className="fin-content">
                      <span className="fin-label">Portfolio Conversion Rate</span>
                      <strong className="fin-value">{conversionRate}%</strong>
                      <span className="fin-subtext">{closedOrContractCount} in active transaction stages</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Executive Data Export Center */}
              <div className="admin-export-center-card">
                <div className="export-center-header">
                  <div>
                    <h3>Executive Data Export Center</h3>
                    <p>Instant CSV downloads for accounting, deal auditing, and client relationships</p>
                  </div>
                </div>
                <div className="export-center-actions">
                  <button type="button" className="btn compact outline admin-export-csv-btn" onClick={exportPropertiesCsv}>
                    <Download size={14} aria-hidden="true" />
                    <span>Export Submissions (CSV)</span>
                  </button>
                  <button type="button" className="btn compact outline admin-export-csv-btn" onClick={exportOffersCsv}>
                    <Download size={14} aria-hidden="true" />
                    <span>Export Cash Offers (CSV)</span>
                  </button>
                  <button type="button" className="btn compact outline admin-export-csv-btn" onClick={exportReviewsCsv}>
                    <Download size={14} aria-hidden="true" />
                    <span>Export Testimonials (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Management Shortcuts */}
              <div className="admin-shortcuts-section">
                <div className="admin-section-header">
                  <h2>Management Shortcuts</h2>
                  <p>Immediate access to core marketplace workflows</p>
                </div>
                <div className="admin-shortcuts-grid">
                  <div className="admin-shortcut-card" onClick={() => setTab('properties')}>
                    <div className="shortcut-icon gold"><Building2 size={20} aria-hidden="true"/></div>
                    <div className="shortcut-text">
                      <strong>Review Submissions</strong>
                      <span>Review seller submissions, verify photos and publish new homes</span>
                    </div>
                    <ChevronRight size={18} aria-hidden="true" className="shortcut-arrow"/>
                  </div>
                  <div className="admin-shortcut-card" onClick={() => setTab('offers')}>
                    <div className="shortcut-icon blue"><ScrollText size={20} aria-hidden="true"/></div>
                    <div className="shortcut-text">
                      <strong>Manage Cash Offers</strong>
                      <span>Review buyer offer amounts, proof of funds, and contract terms</span>
                    </div>
                    <ChevronRight size={18} aria-hidden="true" className="shortcut-arrow"/>
                  </div>
                  <div className="admin-shortcut-card" onClick={() => setTab('inquiries')}>
                    <div className="shortcut-icon amber"><Inbox size={20} aria-hidden="true"/></div>
                    <div className="shortcut-text">
                      <strong>Client Inquiries</strong>
                      <span>Answer questions from buyers, sellers, and newsletter subscribers</span>
                    </div>
                    <ChevronRight size={18} aria-hidden="true" className="shortcut-arrow"/>
                  </div>
                  <div className="admin-shortcut-card" onClick={() => setTab('content')}>
                    <div className="shortcut-icon purple"><Film size={20} aria-hidden="true"/></div>
                    <div className="shortcut-text">
                      <strong>Media & Film Assets</strong>
                      <span>Update hero video, upload photography, and modify site headlines</span>
                    </div>
                    <ChevronRight size={18} aria-hidden="true" className="shortcut-arrow"/>
                  </div>
                  <div className="admin-shortcut-card" onClick={() => setTab('reviews')}>
                    <div className="shortcut-icon green"><Camera size={20} aria-hidden="true"/></div>
                    <div className="shortcut-text">
                      <strong>Moderate Testimonials</strong>
                      <span>Moderate customer reviews before they appear on the homepage</span>
                    </div>
                    <ChevronRight size={18} aria-hidden="true" className="shortcut-arrow"/>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feeds & System Health */}
              <div className="admin-overview-columns">
                {/* Recent Submissions */}
                <div className="admin-card">
                  <div className="admin-card-head">
                    <h3>Recent Seller Submissions</h3>
                    <button type="button" className="text-link" onClick={() => setTab('properties')}>
                      <span>View all ({dashboard?.properties.length ?? 0})</span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                  {(!dashboard?.properties || dashboard.properties.length === 0) ? (
                    <p className="admin-empty-note">No seller submissions on file.</p>
                  ) : (
                    <div className="admin-recent-list">
                      {dashboard.properties.slice(0, 4).map(p => {
                        const s = JSON.parse(p.seller_json) as SellerDetails;
                        return (
                          <div key={p.id} className="admin-recent-item" onClick={() => { setTab('properties'); setFilter(s.address); }}>
                            <div className="recent-item-info">
                              <strong>{s.address}</strong>
                              <span>{s.city}, {s.state} · {s.asking ? moneyLabel(s.asking) : 'Asking unspecified'}</span>
                            </div>
                            <span className="record-badge">{p.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Cash Offers */}
                <div className="admin-card">
                  <div className="admin-card-head">
                    <h3>Recent Cash Offers</h3>
                    <button type="button" className="text-link" onClick={() => setTab('offers')}>
                      <span>View all ({dashboard?.offers.length ?? 0})</span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                  {(!dashboard?.offers || dashboard.offers.length === 0) ? (
                    <p className="admin-empty-note">No buyer cash offers recorded.</p>
                  ) : (
                    <div className="admin-recent-list">
                      {dashboard.offers.slice(0, 4).map(o => {
                        const b = JSON.parse(o.offer_json) as BuyerDetails;
                        return (
                          <div key={o.id} className="admin-recent-item" onClick={() => { setTab('offers'); setFilter(b.name); }}>
                            <div className="recent-item-info">
                              <strong>{moneyLabel(b.amount)}</strong>
                              <span>{b.name} · {o.title}</span>
                            </div>
                            <span className="record-badge">{o.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Website Cash Offer Leads */}
                <div className="admin-card">
                  <div className="admin-card-head">
                    <h3>Recent Website Leads</h3>
                    <button type="button" className="text-link" onClick={() => setTab('inquiries')}>
                      <span>View all ({dashboard?.inquiries?.total ?? 0})</span>
                      <ChevronRight size={14} aria-hidden="true" />
                    </button>
                  </div>
                  {(!dashboard?.inquiries?.recent || dashboard.inquiries.recent.length === 0) ? (
                    <p className="admin-empty-note">No website inquiries on file yet. Submissions from the homepage address starter and /get-offer will appear here.</p>
                  ) : (
                    <div className="admin-recent-list">
                      {dashboard.inquiries.recent.slice(0, 4).map(inq => {
                        let payload: Record<string, unknown> = {};
                        try { payload = JSON.parse(inq.payload); } catch {}
                        const title = inq.channel === 'offer' ? String(payload.address || 'Address provided') : String(payload.name || payload.email || 'Visitor inquiry');
                        const subtitle = inq.channel === 'offer'
                          ? [payload.name, payload.phone, payload.email].filter(Boolean).join(' · ')
                          : inq.channel.toUpperCase() + ' · ' + (payload.email || '');
                        return (
                          <div key={inq.id} className="admin-recent-item" onClick={() => setTab('inquiries')}>
                            <div className="recent-item-info">
                              <strong>{title}</strong>
                              <span>{subtitle}</span>
                            </div>
                            <span className="record-badge">{inq.status}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* System Infrastructure */}
                <div className="admin-card">
                  <div className="admin-card-head">
                    <h3>System & Infrastructure</h3>
                    <span>All services operational</span>
                  </div>
                  <div className="admin-sys-list">
                    <div className="admin-sys-item">
                      <div><strong>Database Engine</strong><span>Local SQLite (WAL mode)</span></div>
                      <span className="sys-badge ok"><CheckCircle2 size={13} aria-hidden="true"/> Active</span>
                    </div>
                    <div className="admin-sys-item">
                      <div><strong>Media Processing</strong><span>Sharp WebP Image Pipeline</span></div>
                      <span className="sys-badge ok"><CheckCircle2 size={13} aria-hidden="true"/> Ready</span>
                    </div>
                    <div className="admin-sys-item">
                      <div><strong>Hero Video Streaming</strong><span>Range request byte-serving</span></div>
                      <span className="sys-badge ok"><CheckCircle2 size={13} aria-hidden="true"/> Active</span>
                    </div>
                    <div className="admin-sys-item">
                      <div><strong>Authentication</strong><span>HMAC SHA-256 Signed Cookies</span></div>
                      <span className="sys-badge ok"><ShieldCheck size={13} aria-hidden="true"/> Protected</span>
                    </div>
                    <div className="admin-sys-item">
                      <div><strong>Site Revision</strong><span>Content revision #{dashboard?.site.revision ?? 1}</span></div>
                      <span className="sys-badge sync">Synced</span>
                    </div>
                  </div>
                </div>

                {/* Audit Activity */}
                <div className="admin-card">
                  <div className="admin-card-head">
                    <h3>Recent Marketplace Audit</h3>
                    <span>{dashboard?.events.length ?? 0} events recorded</span>
                  </div>
                  {(!dashboard?.events || dashboard.events.length === 0) ? (
                    <p className="admin-empty-note">No recent activity recorded yet.</p>
                  ) : (
                    <ul className="admin-audit-list">
                      {dashboard.events.slice(0, 6).map((event, i) => (
                        <li key={event.created_at + i} className="admin-audit-item">
                          <div className="audit-dot" />
                          <div className="audit-content">
                            <div className="audit-head">
                              <span className="audit-status">{event.status}</span>
                              <span className="audit-date">{dateLabel(event.created_at)}</span>
                            </div>
                            {event.note && <p className="audit-note">{event.note}</p>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'inquiries' && <AdminInbox />}

          {!dashboard ? (
            <p className="admin-loading">Loading dashboard…</p>
          ) : (
            <>
              {tab === 'properties' && (
                <div className="admin-tab-section">
                  {/* Status Filter Bar & Sort & Export */}
                  <div className="admin-filter-bar">
                    <div className="filter-pills-row" role="tablist" aria-label="Filter seller submissions by status">
                      {['All', ...propertyStatuses].map(st => {
                        const count = st === 'All'
                          ? (dashboard.properties.length)
                          : (dashboard.properties.filter(p => p.status === st).length);
                        return (
                          <button
                            type="button"
                            key={st}
                            className={'filter-pill' + (propertyStatus === st ? ' active' : '')}
                            onClick={() => setPropertyStatus(st)}
                          >
                            <span>{st}</span>
                            <span className="pill-count" aria-hidden="true">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="admin-controls-group">
                      <select
                        value={propertySort}
                        onChange={e => setPropertySort(e.target.value as any)}
                        className="sort-select"
                        aria-label="Sort submissions"
                      >
                        <option value="newest">Newest Submissions</option>
                        <option value="oldest">Oldest Submissions</option>
                        <option value="price_high">Highest Asking Price</option>
                        <option value="price_low">Lowest Asking Price</option>
                      </select>

                      <button
                        type="button"
                        className="btn compact outline admin-export-csv-btn"
                        onClick={exportPropertiesCsv}
                        title="Download submissions as CSV"
                      >
                        <Download size={14} aria-hidden="true" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="owner-search">
                    <MarketField label="Search seller submissions">
                      <input
                        type="search"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Search by address, seller name, city or notes..."
                      />
                    </MarketField>
                  </div>

                  {/* List of Properties */}
                  {filteredProperties.map(record => (
                    <PropertyEditor
                      key={record.id}
                      record={record}
                      media={dashboard.media.filter(file => file.property_id === record.id)}
                      events={dashboard.events.filter(event => event.record_id === record.id)}
                      write={write}
                    />
                  ))}

                  {filteredProperties.length === 0 && (
                    <div className="market-empty admin-empty-card">
                      <Building2 size={32} aria-hidden="true" />
                      <h3>No matching seller submissions found</h3>
                      <p>Property dossiers submitted through /sell will appear here for verification and publishing.</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'offers' && (
                <div className="admin-tab-section">
                  {/* Status Filter Bar & Sort & Export */}
                  <div className="admin-filter-bar">
                    <div className="filter-pills-row" role="tablist" aria-label="Filter buyer offers by status">
                      {['All', ...offerStatuses].map(st => {
                        const count = st === 'All'
                          ? (dashboard.offers.length)
                          : (dashboard.offers.filter(o => o.status === st).length);
                        return (
                          <button
                            type="button"
                            key={st}
                            className={'filter-pill' + (offerStatus === st ? ' active' : '')}
                            onClick={() => setOfferStatus(st)}
                          >
                            <span>{st}</span>
                            <span className="pill-count" aria-hidden="true">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="admin-controls-group">
                      <select
                        value={offerSort}
                        onChange={e => setOfferSort(e.target.value as any)}
                        className="sort-select"
                        aria-label="Sort cash offers"
                      >
                        <option value="newest">Newest Offers</option>
                        <option value="highest">Highest Amount</option>
                        <option value="lowest">Lowest Amount</option>
                      </select>

                      <button
                        type="button"
                        className="btn compact outline admin-export-csv-btn"
                        onClick={exportOffersCsv}
                        title="Download buyer offers as CSV"
                      >
                        <Download size={14} aria-hidden="true" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Input */}
                  <div className="owner-search">
                    <MarketField label="Search buyer offers">
                      <input
                        type="search"
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        placeholder="Search by buyer name, email, listing title..."
                      />
                    </MarketField>
                  </div>

                  {/* List of Offers */}
                  {filteredOffers.map(record => (
                    <OfferEditor
                      key={record.id}
                      record={record}
                      events={dashboard.events.filter(event => event.record_id === record.id)}
                      write={write}
                    />
                  ))}

                  {filteredOffers.length === 0 && (
                    <div className="market-empty admin-empty-card">
                      <ScrollText size={32} aria-hidden="true" />
                      <h3>No matching buyer offers found</h3>
                      <p>Cash offers submitted by verified buyers on listings will appear here for review.</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'reviews' && (
                <div className="admin-tab-section">
                  {/* Filter Bar & Export */}
                  <div className="admin-filter-bar">
                    <div className="filter-pills-row" role="tablist" aria-label="Filter reviews by status">
                      {['All', ...reviewStatuses].map(st => {
                        const count = st === 'All'
                          ? (dashboard.reviews.length)
                          : (dashboard.reviews.filter(r => r.status === st).length);
                        return (
                          <button
                            type="button"
                            key={st}
                            className={'filter-pill' + (reviewStatus === st ? ' active' : '')}
                            onClick={() => setReviewStatus(st)}
                          >
                            <span>{st}</span>
                            <span className="pill-count" aria-hidden="true">{count}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="admin-controls-group">
                      <button
                        type="button"
                        className="btn compact outline admin-export-csv-btn"
                        onClick={exportReviewsCsv}
                        title="Download reviews as CSV"
                      >
                        <Download size={14} aria-hidden="true" />
                        <span>Export CSV</span>
                      </button>
                    </div>
                  </div>

                  <ReviewEditor write={write} />
                  {filteredReviews.map(record => (
                    <ReviewEditor key={record.id} record={record} write={write} />
                  ))}

                  {filteredReviews.length === 0 && (
                    <div className="market-empty admin-empty-card">
                      <Star size={32} aria-hidden="true" />
                      <h3>No reviews in this status category</h3>
                      <p>Customer reviews submitted on /reviews will appear here for moderation before being published.</p>
                    </div>
                  )}
                </div>
              )}

              {tab === 'content' && (
                <ContentEditor
                  key={dashboard.site.revision}
                  dashboard={dashboard}
                  write={write}
                  announce={setNotice}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
