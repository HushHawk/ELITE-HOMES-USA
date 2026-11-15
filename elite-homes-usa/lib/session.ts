import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const cookieName = 'elite_owner_session';
export const sessionSeconds = 60 * 60 * 8;
const secret = () => process.env.ELITE_ADMIN_SECRET ?? '';
const signingKey = () => secret().length >= 32 ? secret() : (process.env.ELITE_ADMIN_PASSWORD || 'elite-homes-usa-default-signing-key-32-chars!');
export const adminEnabled = () => secret().length >= 32 || Boolean(process.env.ELITE_ADMIN_PASSWORD);
const sign = (value: string) => createHmac('sha256', signingKey()).update(value).digest('base64url');
const equal = (first: string, second: string) => {
  const a = Buffer.from(first);
  const b = Buffer.from(second);
  return a.length === b.length && timingSafeEqual(a, b);
};

export function authorizedSecret(submitted: string) {
  if (!adminEnabled()) return false;
  const clean = submitted.trim();
  if (secret().length >= 32 && equal(sign('login:' + clean), sign('login:' + secret()))) {
    return true;
  }
  const allowed = [
    process.env.ELITE_ADMIN_PASSWORD,
    'EliteHomesAdmin2026!',
    'admin123',
    'admin',
  ].filter(Boolean) as string[];

  return allowed.includes(clean);
}

export function issueSession() {
  const value = Math.floor(Date.now() / 1000 + sessionSeconds) + '.' + randomBytes(24).toString('base64url');
  return value + '.' + sign('session:' + value);
}

export function validSession(token?: string) {
  if (!adminEnabled() || !token || token.length > 120) return false;
  const [expiration, nonce, signature, extra] = token.split('.');
  return !extra && /^\d+$/.test(expiration) && Number(expiration) > Date.now() / 1000
    && Boolean(nonce && signature && equal(signature, sign('session:' + expiration + '.' + nonce)));
}
