'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowRight, Check, Copy, Download, Inbox, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import { channels, statuses, type Channel } from '@/lib/schema';
import type { Activity, InboxRow } from '@/lib/store';

async function adminRequest(path: string, method: string, body?: unknown) {
  const response = await fetch('/api/admin/' + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(12000) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result;
}

export function SignIn() {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState('admin@elitehomes1.com');
  const [secret, setSecret] = useState('');
  const router = useRouter();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = new FormData(event.currentTarget);
      await adminRequest('session', 'POST', {
        secret: data.get('secret'),
        username: data.get('username'),
      });
      window.location.href = '/admin';
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to sign in.'); }
    finally { setBusy(false); }
  }

  function fillDemo() {
    setUsername('admin@elitehomes1.com');
    setSecret('EliteHomesAdmin2026!');
    setError('');
  }

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText('EliteHomesAdmin2026!');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      fillDemo();
    }
  }

  return <form className="form-panel admin-signin" onSubmit={submit}>
    <div className="admin-signin-badge">
      <ShieldCheck size={17}/> <span>Owner Portal Access</span>
    </div>
    <h2>Sign in</h2>
    <p className="admin-signin-desc">Enter your administrator credentials or owner secret to manage property inquiries, offers, and gallery content.</p>

    <label className="field">
      <span>Username or Email</span>
      <input
        name="username"
        type="text"
        value={username}
        onChange={e => setUsername(e.target.value)}
        autoComplete="username"
      />
    </label>

    <label className="field">
      <span>Owner access secret</span>
      <input
        name="secret"
        type="password"
        value={secret}
        onChange={e => setSecret(e.target.value)}
        placeholder="Enter password or secret key"
        autoComplete="current-password"
        required
        maxLength={512}
      />
    </label>

    {error && <p role="alert" className="form-error">{error}</p>}

    <button className="btn gold admin-submit-btn" disabled={busy}>
      <span>{busy ? 'Signing in…' : 'Sign In to Dashboard'}</span>
      <ArrowRight size={16}/>
    </button>

    <div className="admin-credentials-card">
      <div className="admin-cred-header">
        <div className="admin-cred-title"><KeyRound size={14}/><span>Default Admin Credentials</span></div>
        <button type="button" className="admin-autofill-btn" onClick={fillDemo}>
          Auto-fill
        </button>
      </div>
      <div className="admin-cred-body">
        <div className="admin-cred-row">
          <small>Username:</small>
          <code>admin@elitehomes1.com</code>
        </div>
        <div className="admin-cred-row">
          <small>Password:</small>
          <code>EliteHomesAdmin2026!</code>
          <button type="button" className="admin-copy-btn" onClick={copyPassword} title="Copy password">
            {copied ? <Check size={12}/> : <Copy size={12}/>}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
      <p className="admin-cred-hint">You can also use the secret key defined in <code>.env.local</code>.</p>
    </div>
  </form>;
}

export function SignOut() {
  const router = useRouter();
  const [error, setError] = useState(false);
  return <div className="admin-signout-wrap">
    <button className="admin-signout-btn" type="button" onClick={async () => {
      try { await adminRequest('session', 'DELETE'); router.refresh(); } catch { setError(true); }
    }}>
      <LogOut size={16} />
      <span>Sign Out</span>
    </button>
    {error && <span role="alert" className="form-error"> Sign-out failed.</span>}
  </div>;
}

const inboxNames = { offer: 'Cash offers', contact: 'Contact', newsletter: 'Newsletter' };
const fieldNames: Record<string,string> = { propertyType: 'Property type', consentVersion: 'Consent version', consentAt: 'Consent recorded at', preferred: 'Preferred contact', utm: 'Campaign attribution', zip: 'ZIP code' };
const formatDate = (value: string) => new Date(value).toLocaleString();

function Record({ row, onSaved }: { row: InboxRow; onSaved: () => void }) {
  const payload = JSON.parse(row.payload) as Record<string, unknown>;
  const [history, setHistory] = useState<Activity[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const title = row.channel === 'offer' ? String(payload.address) : String(payload.name || payload.email);
  async function loadHistory() {
    try { setHistory((await adminRequest('records?id=' + row.id, 'GET')).history); }
    catch { setMessage('Unable to load the activity history.'); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    try {
      await adminRequest('records', 'PATCH', { id: row.id, ...values });
      const note = form.elements.namedItem('note');
      if (note instanceof HTMLTextAreaElement) note.value = '';
      setMessage('Changes saved.');
      onSaved();
      await loadHistory();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save.'); }
    finally { setBusy(false); }
  }
  return <details className="admin-record" onToggle={event => {
    if (event.currentTarget.open && row.channel !== 'newsletter') void loadHistory();
  }}>
    <summary><strong>{title}</strong><span>{row.channel === 'newsletter' ? (row.active ? 'Active' : 'Unsubscribed') : row.status}</span><time dateTime={row.created_at}>{formatDate(row.created_at)}</time></summary>
    <div className="admin-record-body"><div><h2>Submission</h2><dl>
      {Object.entries(payload).filter(([, value]) => value !== '').map(([key,value]) => <div key={key}><dt>{fieldNames[key] || (key[0].toUpperCase() + key.slice(1))}</dt><dd>{typeof value === 'object' && value ? Object.entries(value).filter(([, v]) => v).map(([k,v]) => k + ' = ' + v).join(', ') || 'None' : String(value)}</dd></div>)}
      <div><dt>Source</dt><dd>{row.source}</dd></div><div><dt>Reference</dt><dd>{row.id}</dd></div>
    </dl></div>
    {row.channel !== 'newsletter' && <div><form onSubmit={save}>
      <label className="admin-field">Status<select name="status" defaultValue={row.status}>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
      <label className="admin-field">Follow-up date<input type="date" name="followUp" defaultValue={row.follow_up}/></label>
      <label className="admin-field">Add a private note<textarea name="note" maxLength={1500} rows={3}/></label>
      <button className="btn gold compact" disabled={busy}>{busy ? 'Saving…' : 'Save Changes'}</button>
    </form><p role="status" className="admin-state">{message}</p>
      {!!history.length && <><h3>Activity</h3><ul>{history.map((event,i) => <li key={event.created_at + i}>{formatDate(event.created_at)} · {event.status}{event.note && <p>{event.note}</p>}</li>)}</ul></>}
    </div>}
    </div>
  </details>;
}

export function AdminInbox() {
  const [channel, setChannel] = useState<Channel>('offer');
  const [filters, setFilters] = useState({ query: '', status: '', page: 1 });
  const [refresh, setRefresh] = useState(0);
  const [result, setResult] = useState<{ records: InboxRow[]; hasNext: boolean; totals: { status: string; total: number }[] }>();
  const [message, setMessage] = useState('');
  useEffect(() => {
    let ignore = false;
    const query = new URLSearchParams({ channel, query: filters.query, status: filters.status, page: String(filters.page) });
    adminRequest('records?' + query, 'GET').then(data => {
      if (!ignore) { setResult(data); setMessage(''); }
    }).catch(e => { if (!ignore) setMessage(e.message); });
    return () => { ignore = true; };
  }, [channel, filters, refresh]);
  return <>
    <div className="admin-tabs" aria-label="Inbox type">{channels.map(item => <button type="button" aria-pressed={item === channel} key={item} onClick={() => {
      if (item !== channel) { setResult(undefined); setChannel(item); setFilters({ query: '', status: '', page: 1 }); }
    }}>{inboxNames[item]}</button>)}</div>
    <form className="admin-tools" key={channel} onSubmit={event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      setResult(undefined);
      setFilters({ query: String(form.get('query') || ''), status: String(form.get('status') || ''), page: 1 });
    }}>
      <label className="admin-field">Search submissions<input name="query" defaultValue={filters.query} maxLength={120} type="search"/></label>
      <label className="admin-field">Status<select name="status" defaultValue={filters.status}><option value="">All statuses</option>{statuses.map(status => <option key={status}>{status}</option>)}</select></label>
      <button className="btn gold compact">Search</button>
      <button
        type="button"
        className="btn compact outline admin-export-csv-btn"
        disabled={!result?.records.length}
        onClick={() => {
          if (!result?.records.length) return;
          const rows = result.records.map(r => ({
            id: r.id,
            channel: r.channel,
            status: r.status,
            created_at: r.created_at,
            follow_up: r.follow_up || '',
            ...JSON.parse(r.payload),
          }));
          const headers = Object.keys(rows[0]);
          const csvContent = [headers.join(','), ...rows.map(row => headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `inquiries_${channel}_${new Date().toISOString().slice(0, 10)}.csv`;
          link.click();
          URL.revokeObjectURL(url);
        }}
      >
        <Download size={14}/> <span>Export CSV</span>
      </button>
    </form>
    <div className="admin-counts">{result?.totals.map(total => <span key={total.status}>{total.status} · {total.total}</span>)}</div>
    {message ? <p className="form-error" role="alert">{message}</p> : !result ? <p role="status">Loading records…</p> : result.records.length === 0 ? (
      <div className="market-empty admin-empty-card">
        <Inbox size={32} aria-hidden="true" />
        <h3>No matching submissions</h3>
        <p>Inquiries received from the website ({inboxNames[channel]}) will appear here in real time.</p>
      </div>
    ) : result.records.map(row => <Record row={row} key={row.id} onSaved={() => setRefresh(value => value + 1)}/>)}
    {result && (result.hasNext || filters.page > 1) && <div className="admin-pagination">
      <button type="button" className="btn compact back-btn" disabled={filters.page === 1} onClick={() => setFilters(value => ({ ...value, page: value.page - 1 }))}>Previous</button>
      <span>Page {filters.page}</span>
      <button type="button" className="btn compact back-btn" disabled={!result.hasNext} onClick={() => setFilters(value => ({ ...value, page: value.page + 1 }))}>Next</button>
    </div>}
  </>;
}
