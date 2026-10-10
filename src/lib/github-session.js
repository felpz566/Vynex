import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

export const GITHUB_SESSION_COOKIE = 'vynex_github_session';
export const GITHUB_STATE_COOKIE = 'vynex_github_oauth_state';

function getKey() {
  const value = process.env.GITHUB_SESSION_SECRET;
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error('GITHUB_SESSION_SECRET must be a 64-character hexadecimal key.');
  }
  return Buffer.from(value, 'hex');
}

export function encryptSession(session) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), 'utf8'),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

export function decryptSession(value) {
  if (!value) return null;

  try {
    const packed = Buffer.from(value, 'base64url');
    if (packed.length < 29) return null;

    const iv = packed.subarray(0, 12);
    const tag = packed.subarray(12, 28);
    const encrypted = packed.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', getKey(), iv);
    decipher.setAuthTag(tag);

    const decoded = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');

    const session = JSON.parse(decoded);
    if (typeof session.accessToken !== 'string' || !session.accessToken) return null;
    if (typeof session.login !== 'string' || !session.login) return null;
    if (typeof session.expiresAt !== 'number' || session.expiresAt <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function cookieOptions(maxAge) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  };
}
