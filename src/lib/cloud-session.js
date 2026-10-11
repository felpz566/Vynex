import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const CLOUD_SESSION_COOKIE = 'vynex_cloud_session';
export const GOOGLE_STATE_COOKIE = 'vynex_google_oauth_state';

function getKey() {
  const secret = process.env.CLOUD_SESSION_SECRET;
  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
    throw new Error('CLOUD_SESSION_SECRET must be a 64-character hexadecimal key.');
  }
  return Buffer.from(secret, 'hex');
}

export function encryptCloudSession(session) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

export function decryptCloudSession(value) {
  if (!value) return null;
  try {
    const packed = Buffer.from(value, 'base64url');
    if (packed.length < 29) return null;
    const decipher = createDecipheriv('aes-256-gcm', getKey(), packed.subarray(0, 12));
    decipher.setAuthTag(packed.subarray(12, 28));
    const decoded = Buffer.concat([
      decipher.update(packed.subarray(28)),
      decipher.final(),
    ]).toString('utf8');
    const session = JSON.parse(decoded);
    if (typeof session.sub !== 'string' || !session.sub) return null;
    if (typeof session.email !== 'string' || !session.email) return null;
    if (typeof session.expiresAt !== 'number' || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function cloudCookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}
