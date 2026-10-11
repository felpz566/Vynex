import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  cloudCookieOptions,
  encryptCloudSession,
  CLOUD_SESSION_COOKIE,
  GOOGLE_STATE_COOKIE,
} from '../../../../../src/lib/cloud-session.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function safeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const savedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const oauthError = url.searchParams.get('error');

  const fail = (reason) => {
    const response = NextResponse.redirect(new URL('/login?google=error', url.origin));
    response.cookies.set(GOOGLE_STATE_COOKIE, '', cloudCookieOptions(0));
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Vynex-Google-Error', reason);
    return response;
  };

  if (oauthError) return fail('Autorização do Google cancelada.');
  if (!code || !safeEqual(state, savedState)) return fail('Estado OAuth inválido. Tente novamente.');

  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const callbackUrl = process.env.GOOGLE_OAUTH_CALLBACK_URL;
  if (!clientId || !clientSecret || !callbackUrl || !process.env.CLOUD_SESSION_SECRET) {
    return NextResponse.json({ error: 'Login Google não está completamente configurado no servidor.' }, { status: 503 });
  }

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: 'authorization_code',
      }),
      cache: 'no-store',
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) return fail('O Google não aceitou o código de autorização.');

    const profileResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const profile = await profileResponse.json();
    if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
      return fail('Não foi possível verificar a conta Google. Use uma conta com e-mail verificado.');
    }

    const maxAge = 60 * 60 * 24 * 7;
    const session = encryptCloudSession({
      provider: 'google',
      sub: profile.sub,
      email: profile.email,
      name: profile.name || profile.given_name || profile.email.split('@')[0],
      avatarUrl: profile.picture || null,
      expiresAt: Date.now() + maxAge * 1000,
    });

    const response = NextResponse.redirect(new URL('/projects?cloud=connected', url.origin));
    response.cookies.set(CLOUD_SESSION_COOKIE, session, cloudCookieOptions(maxAge));
    response.cookies.set(GOOGLE_STATE_COOKIE, '', cloudCookieOptions(0));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return fail('Erro inesperado ao conectar com o Google.');
  }
}
