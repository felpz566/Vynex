import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cookieOptions, GITHUB_STATE_COOKIE } from '../../../../../src/lib/github-session.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_APP_CALLBACK_URL;

  if (!clientId || !callbackUrl) {
    return NextResponse.json(
      { error: 'Integração GitHub não configurada. Defina GITHUB_APP_CLIENT_ID e GITHUB_APP_CALLBACK_URL.' },
      { status: 503 },
    );
  }

  const state = randomBytes(32).toString('base64url');
  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);
  authorizeUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(GITHUB_STATE_COOKIE, state, cookieOptions(600));
  return response;
}
