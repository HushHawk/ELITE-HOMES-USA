'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, Check, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { conditions, contactMethods, viewingMethods, newsletterDisclosure, occupancies, offerSteps, propertyTypes, timelines } from '@/lib/schema';

type Field = { name: string; label: string; type?: string; options?: readonly string[]; placeholder?: string; wide?: boolean; optional?: boolean; auto?: string; max?: number };
type Values = Record<string, string>;
type Result = { success?: boolean; reference?: string; preview?: boolean; unsubscribeToken?: string; error?: string; fields?: Record<string, string[]> };
const offerFields: Field[][] = [
  [
    { name: 'address', label: 'Street address', placeholder: '123 Main Street', wide: true, auto: 'street-address', max: 180 },
    { name: 'city', label: 'City', placeholder: 'Jacksonville', auto: 'address-level2', max: 90 },
    { name: 'state', label: 'State', auto: 'address-level1', max: 2 },
    { name: 'zip', label: 'ZIP code', auto: 'postal-code', max: 10 },
    { name: 'propertyType', label: 'Property type', options: propertyTypes },
  ],
  [
    { name: 'condition', label: 'Overall condition', options: conditions },
    { name: 'occupancy', label: 'Occupancy', options: occupancies },
    { name: 'bedrooms', label: 'Bedrooms', optional: true, max: 2 },
    { name: 'bathrooms', label: 'Bathrooms', optional: true, max: 4 },
    { name: 'timeline', label: 'When would you like to sell?', options: timelines, wide: true },
    { name: 'viewing', label: 'How would you like us to see the home?', options: viewingMethods, optional: true, wide: true },
    { name: 'visitWindow', label: 'Days or times that work for a visit', placeholder: 'e.g. weekday afternoons', optional: true, wide: true, max: 120 },
    { name: 'notes', label: 'Anything else we should know?', type: 'textarea', optional: true, wide: true, max: 1600 },
  ],
  [
    { name: 'name', label: 'Full name', auto: 'name', wide: true, max: 100 },
    { name: 'phone', label: 'Phone', type: 'tel', auto: 'tel', max: 25 },
    { name: 'email', label: 'Email', type: 'email', auto: 'email', max: 254, optional: true },
    { name: 'preferred', label: 'Preferred contact method', options: contactMethods, wide: true },
  ],
];
const contactFields: Field[] = [
  { name: 'firstName', label: 'First name', auto: 'given-name', max: 50 },
  { name: 'lastName', label: 'Last name', auto: 'family-name', max: 49 },
  { name: 'email', label: 'Email', type: 'email', auto: 'email', max: 254 },
  { name: 'phone', label: 'Phone', type: 'tel', auto: 'tel', max: 25 },
  { name: 'message', label: 'How can we help?', type: 'textarea', wide: true, max: 1600 },
];
const stepNames = ['Property', 'Condition', 'Contact', 'Review'];

function Input({ field, value, error, onChange }: { field: Field; value: string; error?: string; onChange: (value: string) => void }) {
  const id = field.name === 'email' && field.label === 'Email address' ? 'newsletter-email' : field.name;
  const common = {
    id, name: field.name, value,
    required: !field.optional,
    'aria-labelledby': id + '-label',
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? id + '-error' : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => onChange(e.target.value),
  };
  return <label className={'field' + (field.wide ? ' field-wide' : '')} htmlFor={id}>
    <span id={id + '-label'}>{field.label}{field.optional && <small> Optional</small>}</span>
    {field.options ? <select {...common}><option value="">Select</option>{field.options.map(option => <option key={option}>{option}</option>)}</select>
      : field.type === 'textarea' ? <textarea {...common} rows={4} maxLength={field.max}/>
      : <input {...common} type={field.type || 'text'} placeholder={field.placeholder} autoComplete={field.auto} maxLength={field.max} inputMode={['zip', 'bedrooms'].includes(field.name) ? 'numeric' : field.name === 'bathrooms' ? 'decimal' : undefined}/>}
    {error && <span className="field-error" id={id + '-error'}>{error}</span>}
  </label>;
}

function useSubmission(channel: string, source: string) {
  const requestId = useRef<string | undefined>(undefined);
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>({});
  async function send(data: unknown, website: string): Promise<Result | undefined> {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setResult({});
    try {
      requestId.current ??= crypto.randomUUID();
      const url = new URLSearchParams(window.location.search);
      const utm = Object.fromEntries(['source', 'medium', 'campaign'].map(field => [field, (url.get('utm_' + field) || '').slice(0, 100)]));
      const response = await fetch('/api/' + channel, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: requestId.current, website, source, data, utm }),
        signal: AbortSignal.timeout(12_000),
      });
      const next: Result = await response.json();
      setResult(next);
      return next;
    } catch {
      const next = { error: 'The request timed out or couldn’t connect. Please try again.' };
      setResult(next);
      return next;
    } finally { setBusy(false); lock.current = false; }
  }
  return { busy, result, send };
}

export function OfferWizard({ preview, type = '', source = 'website' }: { preview: boolean; type?: string; source?: string }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({ state: 'FL', propertyType: type, preferred: 'Phone' });
  useEffect(() => {
    if (source !== 'home') return;
    try {
      const street = sessionStorage.getItem('elite.offer.street');
      sessionStorage.removeItem('elite.offer.street');
      if (street) queueMicrotask(() => setValues(old => ({ ...old, address: old.address || street })));
    } catch { /* Manual entry is available. */ }
  }, [source]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [website, setWebsite] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const success = useRef<HTMLHeadingElement>(null);
  const { busy, result, send } = useSubmission('offer', source);
  function go(next: number) {
    setErrors({});
    setStep(next);
    requestAnimationFrame(() => heading.current?.focus());
  }
  async function advance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 3) {
      const fields = offerSteps[step].safeParse(Object.fromEntries(offerFields[step].map(field => [field.name, values[field.name] || ''])));
      if (fields.success) return go(step + 1);
      const messages = Object.fromEntries(fields.error.issues.map(issue => [String(issue.path[0]), [issue.message]]));
      setErrors(messages);
      requestAnimationFrame(() => document.getElementById(Object.keys(messages)[0])?.focus());
      return;
    }
    const next = await send(values, website);
    if (next?.success && next.reference) {
      try { sessionStorage.setItem('elite.offer.receipt', JSON.stringify({ reference: next.reference, preview: next.preview })); } catch { /* Inline receipt is still available. */ }
      requestAnimationFrame(() => success.current?.focus());
    } else if (next?.fields) {
      const affected = offerFields.findIndex(fields => fields.some(field => next.fields?.[field.name]));
      if (affected >= 0) { go(affected); setErrors(next.fields); }
    }
  }

  if (result.success && result.reference) return <div className="form-panel result-panel" role="status"><Check size={34}/><h2 ref={success} tabIndex={-1}>{result.preview ? 'Test request saved.' : 'Your request is in.'}</h2><p>{result.preview ? 'This preview saved your test request. Please don’t use it for a real property.' : 'Our team will review your details and follow up using your preferred contact method.'}</p><p className="reference">Reference {result.reference}</p><Link href="/thank-you" className="text-link">View receipt <ArrowRight size={17}/></Link></div>;

  return <div className="form-panel">
    {preview && <p className="preview-notice">Preview mode. Use sample information only.</p>}
    <ol className="wizard-nav" aria-label="Offer progress">{stepNames.map((name, i) => <li className={i <= step ? 'reached' : ''} aria-current={i === step ? 'step' : undefined} key={name}><span>{i < step ? <Check size={13}/> : i + 1}</span>{name}</li>)}</ol>
    <form onSubmit={advance} noValidate>
      <h2 ref={heading} tabIndex={-1}>{['About the property', 'Condition and timing', 'How to reach you', 'Review your request'][step]}</h2>
      {step < 3 ? <div className="form-grid">{offerFields[step].map(field => <Input key={field.name} field={field} value={values[field.name] || ''} error={errors[field.name]?.[0]} onChange={value => {
        setValues(old => ({ ...old, [field.name]: value }));
        if (errors[field.name]) setErrors(old => ({ ...old, [field.name]: [] }));
      }}/>)}</div>
        : <div className="review-grid">{offerFields.map((fields, i) => <section key={stepNames[i]}><div><h3>{stepNames[i]}</h3><button type="button" className="text-link" onClick={() => go(i)}>Edit {stepNames[i].toLowerCase()}</button></div><dl>{fields.filter(field => values[field.name]).map(field => <div key={field.name}><dt>{field.label}</dt><dd>{values[field.name]}</dd></div>)}</dl></section>)}</div>}
      <label className="honey" aria-hidden="true">Leave this empty<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)}/></label>
      {result.error && <p className="form-error" role="alert">{result.error}</p>}
      <div className="wizard-actions">
        {step > 0 && <button className="btn back-btn" type="button" disabled={busy} onClick={() => go(step - 1)}> Back</button>}
        <button className="btn gold" type="submit" disabled={busy}>{busy ? 'Saving…' : step === 3 ? 'Submit Request' : 'Continue'}</button>
      </div>
      <p className="form-policy"><LockKeyhole size={14}/> <span>See our <Link href="/privacypolicy">Privacy Policy</Link> and <Link href="/terms-of-use">Terms</Link>.</span></p>
    </form>
  </div>;
}

export function SimpleForm({ kind, preview }: { kind: 'contact' | 'newsletter'; preview: boolean }) {
  const [values, setValues] = useState<Values>({});
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState('');
  const { busy, result, send } = useSubmission(kind, kind === 'contact' ? 'contact' : 'footer');
  const fields = kind === 'contact' ? contactFields : [{ name: 'email', label: 'Email address', type: 'email', auto: 'email', max: 254, placeholder: 'you@example.com' }];
  function submit(event: FormEvent) {
    event.preventDefault();
    const contact = { ...values, name: [values.firstName, values.lastName].map(value => (value || '').trim()).filter(Boolean).join(' ') };
    void send(kind === 'contact' ? contact : { email: values.email, consent }, website);
  }
  if (result.success) return <div className="simple-result" role="status"><Check size={22}/><p>{result.preview ? 'Your test submission was saved.' : kind === 'contact' ? 'Your message was received.' : 'Your subscription is active.'}</p>
    {result.unsubscribeToken && <Link href={'/unsubscribe#' + result.unsubscribeToken} className="text-link">Manage subscription <ArrowUpRight size={15}/></Link>}</div>;

  return <form className={kind === 'contact' ? 'form-panel contact-form' : 'newsletter-form'} onSubmit={submit}>
    {kind === 'contact' && <><h2>Send a message</h2>{preview && <p className="preview-notice">Preview mode. Use sample information only.</p>}</>}
    <div className="form-grid">{fields.map(field => <Input field={field} key={field.name} value={values[field.name] || ''} error={result.fields?.[field.name]?.[0]} onChange={value => setValues(old => ({ ...old, [field.name]: value }))}/>)}</div>
    <label className="honey" aria-hidden="true">Leave this empty<input tabIndex={-1} autoComplete="off" value={website} onChange={event => setWebsite(event.target.value)}/></label>
    {kind === 'newsletter' ? <label className="check-field"><input type="checkbox" required checked={consent} onChange={event => setConsent(event.target.checked)}/><span>{newsletterDisclosure} {preview && 'Preview mode.'}</span></label>
      : <p className="form-policy"><LockKeyhole size={14}/> <span>See our <Link href="/privacypolicy">Privacy Policy</Link>.</span></p>}
    {result.error && <p className="form-error" role="alert">{result.error}</p>}
    <button className="btn gold compact" type="submit" disabled={busy}>{busy ? 'Saving…' : kind === 'contact' ? 'Send My Question' : 'Subscribe'}</button>
  </form>;
}

export function Receipt() {
  const [receipt, setReceipt] = useState<{ reference?: string; preview?: boolean } | null>(null);
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('elite.offer.receipt');
      if (stored) queueMicrotask(() => setReceipt(JSON.parse(stored)));
    } catch { /* The inline confirmation remains available if storage is disabled. */ }
  }, []);
  return <div className="receipt">{receipt?.reference ? <div><h1>{receipt.preview ? 'Test request saved.' : 'Request received.'}</h1><p className="reference">Reference {receipt.reference}</p></div> : <div><h1>Home requests</h1><p>Tell us about your home to receive a reference number.</p></div>}<Link href="/get-offer" className="text-link">Go to the form <ArrowRight size={17}/></Link></div>;
}

export function Unsubscribe() {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function unsubscribe() {
    setBusy(true);
    try {
      const response = await fetch('/api/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: window.location.hash.slice(1) }), signal: AbortSignal.timeout(12_000) });
      const result = await response.json();
      setMessage(result.success ? 'This subscription link is now inactive.' : result.error);
    } catch { setMessage('Unable to connect. Please try again.'); }
    finally { setBusy(false); }
  }
  return <><h1>Manage your subscription</h1><p>Stop receiving email updates from Elite Homes USA.</p><button className="btn gold" type="button" onClick={unsubscribe} disabled={busy}>{busy ? 'Saving…' : 'Unsubscribe'}</button>{message && <p role="status">{message}</p>}</>;
}


export function AddressStarter() {
  const router = useRouter();
  function begin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const street = String(new FormData(event.currentTarget).get('street') || '').trim();
    try { sessionStorage.setItem('elite.offer.street', street); } catch { /* Manual entry is available. */ }
    router.push('/get-offer?from=home');
  }
  return <form className="address-starter" onSubmit={begin}>
    <label className="field" htmlFor="start-address">Property street address</label>
    <div><input id="start-address" name="street" placeholder="Enter your street address" autoComplete="street-address" required maxLength={180}/><button className="btn gold" type="submit">Start the Conversation</button></div>
  </form>;
}

export function QuickCashOfferForm({ className }: { className?: string }) {
  const [values, setValues] = useState({ name: '', address: '', phone: '', email: '' });
  const [smsConsent, setSmsConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ reference?: string; preview?: boolean } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          address: values.address,
          phone: values.phone,
          email: values.email || undefined,
          notes: 'Submitted via home page introduction form',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit offer request.');
      setSuccess({ reference: data.reference, preview: data.preview });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className={'quick-offer-success-card ' + (className || '')} role="status">
        <CheckCircle2 size={44} className="gold-icon" />
        <h3>Thank you. We’ve received your note.</h3>
        <p>
          Thank you, <strong>{values.name}</strong>. Darren Richardson and the Elite Homes USA acquisitions team have received your details for <strong>{values.address}</strong>.
        </p>
        <div className="receipt-ref-box">
          <small>Submission Reference</small>
          <strong>{success.reference || 'EH-' + Math.random().toString(36).substring(2, 9).toUpperCase()}</strong>
        </div>
        <p className="guarantee-note">We’ll reach out to you at {values.phone} to say hello and find a time to view the property, in person or through your photos and video.</p>
        <Link href="/get-offer" className="btn compact gold">
          <span>Want to add photos or details about the home? Share them here</span>
         
        </Link>
      </div>
    );
  }

  return (
    <div className={'quick-cash-offer-card ' + (className || '')}>
      <div className="quick-offer-head">
        <span className="quick-offer-badge">FRIENDLY, LOCAL & UNHURRIED</span>
        <h2>Thinking About Selling?<br className="quick-offer-title-br" /> <em>Let’s Talk It Over</em></h2>
        <p className="quick-offer-sub">Tell us about your home and we’ll reach out. We view every property in person, or through your photos and video, and prepare an offer after a walk-through.</p>
        <div className="quick-offer-benefits">
          <div className="quick-offer-benefit-item">
            <Check size={16} className="gold-icon" />
            <span>We view every home in person or by video</span>
          </div>
          <div className="quick-offer-benefit-item">
            <Check size={16} className="gold-icon" />
            <span>Sell as-is, no repairs required</span>
          </div>
          <div className="quick-offer-benefit-item">
            <Check size={16} className="gold-icon" />
            <span>An offer only after a walk-through</span>
          </div>
        </div>
      </div>

      <form className="quick-offer-form" onSubmit={submit}>
        <div className="quick-offer-grid">
          <div className="quick-offer-field">
            <label htmlFor="quick-name">Name *</label>
            <input
              id="quick-name"
              name="name"
              type="text"
              required
              placeholder="Your full name"
              value={values.name}
              onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
            />
          </div>

          <div className="quick-offer-field">
            <label htmlFor="quick-phone">Phone *</label>
            <input
              id="quick-phone"
              name="phone"
              type="tel"
              required
              placeholder="(904) 555-0123"
              value={values.phone}
              onChange={e => setValues(v => ({ ...v, phone: e.target.value }))}
            />
          </div>

          <div className="quick-offer-field">
            <label htmlFor="quick-address">Address *</label>
            <input
              id="quick-address"
              name="address"
              type="text"
              required
              placeholder="Property street address"
              value={values.address}
              onChange={e => setValues(v => ({ ...v, address: e.target.value }))}
            />
          </div>

          <div className="quick-offer-field">
            <label htmlFor="quick-email">Email (Optional)</label>
            <input
              id="quick-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={values.email}
              onChange={e => setValues(v => ({ ...v, email: e.target.value }))}
            />
          </div>
        </div>

        <label className="quick-offer-sms-consent">
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={e => setSmsConsent(e.target.checked)}
          />
          <span>
            You are agreeing to receive SMS regarding recurring updates and insights from Elite Homes USA. Message frequency may vary. Standard Message and Data Rates may apply. Reply STOP to opt out. Reply Help for help. Consent is not a condition of purchase. For further information please check out our <Link href="/privacypolicy">Privacy Policy</Link>.
          </span>
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <button type="submit" className="btn hero-primary quick-offer-submit-btn" disabled={busy}>
          <span>{busy ? 'Sending…' : 'Say Hello'}</span>
         
        </button>
      </form>
    </div>
  );
}
