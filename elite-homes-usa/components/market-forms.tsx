'use client';

import { Check, ImagePlus, LockKeyhole, X } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { MAX_PHOTOS, marketPropertyTypes, moneyLabel } from '@/lib/market-schema';
import { preparePhoto } from '@/lib/photo-client';

export const textValue = (fields: FormData, key: string) => String(fields.get(key) ?? '').trim();
export const numberValue = (fields: FormData, key: string) => textValue(fields, key) ? Number(textValue(fields, key)) : null;

export function MarketField({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) {
  return <label className={wide ? 'field field-wide' : 'field'}><span>{label}</span>{children}</label>;
}

export function PropertyFields({ values, publicView = false }: {
  values?: { city?: string; state?: string; propertyType?: string; bedrooms?: number | null; bathrooms?: number | null; area?: number | null; asking?: number | null };
  publicView?: boolean;
}) {
  return <>
    <MarketField label="City"><input name="city" defaultValue={values?.city} maxLength={90} autoComplete={publicView ? 'off' : 'address-level2'} required/></MarketField>
    <MarketField label="State"><input name="state" defaultValue={values?.state ?? 'FL'} maxLength={2} autoComplete={publicView ? 'off' : 'address-level1'} required/></MarketField>
    <MarketField label="Property type" wide><select name="propertyType" defaultValue={values?.propertyType || ''} required><option value="">Select a type</option>{marketPropertyTypes.map(type => <option key={type}>{type}</option>)}</select></MarketField>
    <MarketField label="Bedrooms"><input name="bedrooms" type="number" min={0} max={99} defaultValue={values?.bedrooms ?? ''}/></MarketField>
    <MarketField label="Bathrooms"><input name="bathrooms" type="number" step=".5" min={0} max={99} defaultValue={values?.bathrooms ?? ''}/></MarketField>
    <MarketField label="Interior area (sq ft)"><input name="area" type="number" min={1} max={1000000} defaultValue={values?.area ?? ''}/></MarketField>
    <MarketField label="Asking price (USD)"><input name="asking" type="number" min={1} max={100000000} defaultValue={values?.asking ?? ''}/></MarketField>
  </>;
}

export function propertyValues(fields: FormData) {
  return {
    city: textValue(fields, 'city'), state: textValue(fields, 'state'), propertyType: textValue(fields, 'propertyType'),
    bedrooms: numberValue(fields, 'bedrooms'), bathrooms: numberValue(fields, 'bathrooms'), area: numberValue(fields, 'area'), asking: numberValue(fields, 'asking'),
  };
}

type Kind = 'sell' | 'offer' | 'review';
type Photo = { file: File; url: string };
type Submitted = { reference: string; preview: boolean };

function useMarket(kind: Kind) {
  const requestId = useRef<string | null>(null);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<Submitted>();
  async function submit(details: Record<string, string | number | boolean | null>, photos?: File[]) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      requestId.current ??= crypto.randomUUID();
      const payload = JSON.stringify({ ...details, requestId: requestId.current });
      const form = new FormData();
      if (photos) {
        form.append('details', payload);
        photos.forEach(file => form.append('photos', file));
      }
      const response = await fetch('/api/market/' + kind, {
        method: 'POST', body: photos ? form : payload,
        headers: photos ? undefined : { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(45_000),
      });
      const result = await response.json();
      if (!response.ok || !result.reference) setError(result.error || 'Please try again.');
      else setSaved(result);
    } catch { setError('The request could not be completed. Your entries are still here. Try again.'); }
    finally { setBusy(false); lock.current = false; }
  }
  return { busy, error, saved, submit };
}

function ContactFields() {
  return <>
    <MarketField label="Full name" wide><input name="name" maxLength={100} autoComplete="name" required/></MarketField>
    <MarketField label="Email"><input name="email" type="email" maxLength={254} autoComplete="email" required/></MarketField>
    <MarketField label="Phone"><input name="phone" type="tel" maxLength={25} autoComplete="tel" placeholder="904-555-0123" required/></MarketField>
  </>;
}

function FormNotice({ preview }: { preview: boolean }) {
  return <>{preview && <p className="preview-notice">Review mode. Use sample details and photos you have permission to share.</p>}<label className="honey" aria-hidden="true">Leave this empty<input name="website" tabIndex={-1} autoComplete="off"/></label></>;
}

function Receipt({ kind, result }: { kind: Kind; result: Submitted }) {
  return <div className="form-panel result-panel" role="status"><Check size={34}/><h2>{result.preview ? 'Sample submission saved.' : kind === 'sell' ? 'Property sent for review.' : kind === 'offer' ? 'Offer received.' : 'Review received.'}</h2>
    <p>{kind === 'sell' ? 'The team can review your private submission and reach you by phone or email.' : kind === 'offer' ? 'The team can contact you to discuss the offer. Any transaction requires a separate agreement.' : 'The team can review your feedback before publishing it.'}</p>
    <p className="reference">Reference {result.reference}</p>
  </div>;
}

export function SellerForm({ preview }: { preview: boolean }) {
  const { busy, error, saved, submit } = useMarket('sell');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const livePhotos = useRef<Photo[]>([]);
  useEffect(() => () => livePhotos.current.forEach(photo => URL.revokeObjectURL(photo.url)), []);
  function updatePhotos(next: Photo[]) { livePhotos.current = next; setPhotos(next); }
  async function choose(files: File[]) {
    if (!files.length || preparing) return;
    if (photos.length + files.length > MAX_PHOTOS) return setPhotoError('You can add up to eight photos.');
    setPreparing(true);
    setPhotoError('');
    try {
      const added: File[] = [];
      for (const file of files) added.push(await preparePhoto(file));
      updatePhotos([...photos, ...added.map(file => ({ file, url: URL.createObjectURL(file) }))]);
    } catch (e) { setPhotoError(e instanceof Error ? e.message : 'The photos could not be prepared.'); }
    finally { setPreparing(false); }
  }
  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!photos.length) return setPhotoError('Add at least one photo to continue.');
    const fields = new FormData(event.currentTarget);
    const keys = ['address', 'zip', 'description', 'name', 'email', 'phone', 'website'];
    void submit({ ...propertyValues(fields), ...Object.fromEntries(keys.map(key => [key, textValue(fields, key)])), photoPermission: fields.get('photoPermission') === 'on' }, photos.map(photo => photo.file));
  }
  if (saved) return <Receipt kind="sell" result={saved}/>;
  return <form className="form-panel market-form" onSubmit={send}>
    <FormNotice preview={preview}/>
    <fieldset disabled={busy || preparing}><legend>The property</legend><div className="form-grid">
      <MarketField label="Street address" wide><input name="address" autoComplete="street-address" maxLength={180} required/></MarketField>
      <MarketField label="ZIP code" wide><input name="zip" autoComplete="postal-code" inputMode="numeric" maxLength={10} required/></MarketField>
      <PropertyFields/>
      <MarketField label="Condition, updates and anything we should know" wide><textarea name="description" rows={5} maxLength={3500} required/></MarketField>
    </div></fieldset>
    <fieldset disabled={busy || preparing}><legend>Property photos</legend>
      <p>Upload up to eight JPG, PNG or WebP files. Leave out personal documents and details you want kept out of view.</p>
      <label className="upload-zone"><ImagePlus size={22}/><span>{preparing ? 'Preparing photos…' : 'Choose photos'}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => {
        void choose(Array.from(e.currentTarget.files || [])); e.currentTarget.value = '';
      }}/></label>
      {photos.length > 0 && <div className="upload-preview">{photos.map((photo, i) => <figure key={photo.url}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={'Property photo ' + (i + 1)}/>
        <button type="button" aria-label={'Remove photo ' + (i + 1)} onClick={() => {
          URL.revokeObjectURL(photo.url); updatePhotos(photos.filter(p => p.url !== photo.url));
        }}><X size={15}/></button>
      </figure>)}</div>}
      {photoError && <p className="form-error" role="alert">{photoError}</p>}
    </fieldset>
    <fieldset disabled={busy}><legend>Your contact details</legend><div className="form-grid"><ContactFields/></div>
      <label className="portal-check"><input name="photoPermission" type="checkbox" required/> <span>I have permission to share these photos and property details with Elite Homes USA for review.</span></label>
    </fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn gold" type="submit" disabled={busy || preparing}>{busy ? 'Uploading…' : 'Send Property for Review'}</button>
    <p className="form-policy"><LockKeyhole size={14}/> <span>Your contact details and original submission are private. See our <Link href="/privacypolicy">Privacy Policy</Link>.</span></p>
  </form>;
}

export function BuyerForm({ listing, asking, preview }: { listing: string; asking: number | null; preview: boolean }) {
  const { busy, error, saved, submit } = useMarket('offer');
  if (saved) return <Receipt kind="offer" result={saved}/>;
  return <form className="form-panel market-form buyer-form" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void submit({ ...Object.fromEntries(['name','phone','email','website','timeline','terms'].map(key => [key, textValue(data, key)])), listing, amount: numberValue(data, 'amount') });
  }}>
    <h2>Send an offer</h2><FormNotice preview={preview}/>
    {asking !== null && <p className="asking-note">Asking price {moneyLabel(asking)}</p>}
    <fieldset disabled={busy}><div className="form-grid">
      <MarketField label="Your offer (USD)" wide><input name="amount" type="number" min={1} max={100000000} required/></MarketField>
      <ContactFields/>
      <MarketField label="Preferred closing timeline" wide><input name="timeline" maxLength={100} placeholder="For example, within 30 days"/></MarketField>
      <MarketField label="Conditions or questions" wide><textarea name="terms" rows={3} maxLength={1800}/></MarketField>
    </div></fieldset>
    <p className="form-policy">The owner will review your offer and may follow up directly using the contact information you submit.</p>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn gold" disabled={busy}>{busy ? 'Sending…' : 'Send Offer'}</button>
  </form>;
}

export function ReviewForm({ preview }: { preview: boolean }) {
  const { busy, error, saved, submit } = useMarket('review');
  if (saved) return <Receipt kind="review" result={saved}/>;
  return <form className="form-panel market-form" onSubmit={event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void submit({ ...Object.fromEntries(['name','email','title','body','website'].map(key => [key,textValue(data,key)])), permission: data.get('permission') === 'on' });
  }}>
    <h2>Share your experience</h2><FormNotice preview={preview}/>
    <fieldset disabled={busy}><div className="form-grid">
      <MarketField label="Display name"><input name="name" maxLength={80} required/></MarketField>
      <MarketField label="Email (private)"><input name="email" type="email" autoComplete="email" maxLength={254} required/></MarketField>
      <MarketField label="Review title" wide><input name="title" maxLength={105} required/></MarketField>
      <MarketField label="Your review" wide><textarea name="body" rows={4} maxLength={1500} required/></MarketField>
    </div><label className="portal-check"><input name="permission" type="checkbox" required/> <span>Elite Homes USA may publish my display name and review.</span></label></fieldset>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="btn gold" disabled={busy}>{busy ? 'Sending…' : 'Submit for Review'}</button>
  </form>;
}
