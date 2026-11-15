import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Brand } from '@/components/chrome';
import { SignIn } from '@/components/inbox';
import { MarketAdmin } from '@/components/market-admin';
import { cookieName, validSession } from '@/lib/session';

export const metadata: Metadata = { title: 'Owner Dashboard | Elite Homes USA', robots: { index: false, follow: false } };

export default async function AdminPage() {
  const authorized = validSession((await cookies()).get(cookieName)?.value);
  if (authorized) {
    return (
      <main className="admin-app-root">
        <MarketAdmin />
      </main>
    );
  }

  return (
    <main className="admin-auth-screen">
      <div className="admin-auth-ambient-glow" aria-hidden="true" />
      <header className="admin-auth-header">
        <div className="shell admin-auth-header-inner">
          <Brand />
          <Link href="/" className="admin-auth-back-link">
            <ArrowLeft size={15} />
            <span>Back to website</span>
          </Link>
        </div>
      </header>

      <div className="admin-auth-container">
        <div className="shell">
          <SignIn />
        </div>
      </div>
    </main>
  );
}
