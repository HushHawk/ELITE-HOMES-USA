import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Building2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Brand, Mark } from '@/components/chrome';
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
        <div className="shell admin-auth-shell">
          <div className="admin-horizontal-card">
            {/* Left Brand Panel */}
            <div className="admin-brand-panel">
              <div className="admin-brand-panel-glow" aria-hidden="true" />
              
              <div className="admin-brand-crest">
                <Mark size={48} />
                <div className="admin-brand-titles">
                  <span className="admin-brand-company">ELITE HOMES USA</span>
                  <span className="admin-brand-portal-label">Executive Owner Portal</span>
                </div>
              </div>

              <div className="admin-brand-body">
                <span className="admin-brand-kicker">Jacksonville, Florida</span>
                <h1>Private Portfolio &amp; Operations Console</h1>
                <p>
                  Direct administrative access for Darren Richardson and the Elite Homes USA acquisitions team to evaluate seller dossiers, manage offers, curate published reviews, and update active inventory.
                </p>
              </div>

              <div className="admin-brand-features">
                <div className="admin-feat-item">
                  <div className="admin-feat-icon">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <strong>Encrypted Operations</strong>
                    <span>HMAC-SHA256 authenticated sessions</span>
                  </div>
                </div>

                <div className="admin-feat-item">
                  <div className="admin-feat-icon">
                    <LockKeyhole size={18} />
                  </div>
                  <div>
                    <strong>Full Decision Authority</strong>
                    <span>Review, approve, and counter property offers</span>
                  </div>
                </div>

                <div className="admin-feat-item">
                  <div className="admin-feat-icon">
                    <Building2 size={18} />
                  </div>
                  <div>
                    <strong>Direct Market Sync</strong>
                    <span>Live database updates to /buy and /sell portals</span>
                  </div>
                </div>
              </div>

              <div className="admin-brand-footer">
                <span>Elite Homes USA Group LLC &bull; Jacksonville, FL</span>
                <span className="admin-confidential">Confidential &bull; Authorized Personnel Only</span>
              </div>
            </div>

            {/* Right Form Panel */}
            <div className="admin-form-panel">
              <SignIn />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
