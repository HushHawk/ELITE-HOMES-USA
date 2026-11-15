import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Brand } from '@/components/chrome';
import { SignIn } from '@/components/inbox';
import { MarketAdmin } from '@/components/market-admin';
import { adminEnabled, cookieName, validSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Owner Dashboard', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const authorized = validSession((await cookies()).get(cookieName)?.value);
  if (authorized) {
    return <main className="admin-app-root">
      <MarketAdmin />
    </main>;
  }

  return <main className="admin admin-auth-screen">
    <header className="admin-top"><div className="shell"><Brand/></div></header>
    <div className="shell">
      <div className="admin-auth-view">
        <h1>Owner dashboard</h1>
        <p className="preview-notice">Secure Owner & Administrator Access</p>
        {adminEnabled() ? <SignIn/> : <p>Configure an owner access secret to enable dashboard sign-in.</p>}
      </div>
    </div>
  </main>;
}
