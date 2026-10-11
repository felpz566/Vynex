import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cloudCookieOptions, GOOGLE_STATE_COOKIE } from '../../../../../src/lib/cloud-session.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const callbackUrl = process.env.GOOGLE_OAUTH_CALLBACK_URL;
  if (!clientId || !callbackUrl) {
    return NextResponse.json(
      { error: 'Login Google não configurado. Defina GOOGLE_OAUTH_CLIENT_ID e GOOGLE_OAUTH_CALLBACK_URL na Vercel.' },
      { status: 503 },
    );
  }

  const state = randomBytes(32).toString('base64url');
  const authorizeUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('scope', 'openid email profile');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('prompt', 'select_account');

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GOOGLE_STATE_COOKIE, state, cloudCookieOptions(600));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
