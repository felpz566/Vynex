import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  cookieOptions,
  encryptSession,
  GITHUB_SESSION_COOKIE,
  GITHUB_STATE_COOKIE,
  GITHUB_RETURN_COOKIE,
} from '../../../../../src/lib/github-session.js';

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
  const savedState = request.cookies.get(GITHUB_STATE_COOKIE)?.value;
  const returnTo = request.cookies.get(GITHUB_RETURN_COOKIE)?.value === '/projects' ? '/projects' : '/github';
  const oauthError = url.searchParams.get('error');

  const fail = (message) => {
    const response = NextResponse.redirect(new URL('/github?github=error', url.origin));
    response.cookies.set(GITHUB_STATE_COOKIE, '', cookieOptions(0));
    response.cookies.set(GITHUB_RETURN_COOKIE, '', cookieOptions(0));
    response.headers.set('Cache-Control', 'no-store');
    response.headers.set('X-Vynex-Integration-Error', message);
    return response;
  };

  if (oauthError) return fail('Autorização do GitHub cancelada.');
  if (!code || !safeEqual(state, savedState)) return fail('Estado OAuth inválido. Tente conectar novamente.');

  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
  const callbackUrl = process.env.GITHUB_APP_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl || !process.env.GITHUB_SESSION_SECRET) {
    return NextResponse.json({ error: 'Integração GitHub não configurada no servidor.' }, { status: 503 });
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
      cache: 'no-store',
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) return fail('Não foi possível obter o token do GitHub.');

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenData.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Vynex-Studio',
      },
      cache: 'no-store',
    });

    const user = await userResponse.json();
    if (!userResponse.ok || !user.login) return fail('Não foi possível verificar a conta do GitHub.');

    const expiresIn = Number(tokenData.expires_in);
    const maxAge = Number.isFinite(expiresIn) && expiresIn > 0
      ? Math.min(expiresIn, 60 * 60 * 24 * 7)
      : 60 * 60 * 24 * 7;

    const encryptedSession = encryptSession({
      accessToken: tokenData.access_token,
      login: user.login,
      avatarUrl: user.avatar_url ?? null,
      expiresAt: Date.now() + maxAge * 1000,
    });

    const response = NextResponse.redirect(new URL(returnTo + '?github=connected', url.origin));
    response.cookies.set(GITHUB_SESSION_COOKIE, encryptedSession, cookieOptions(maxAge));
    response.cookies.set(GITHUB_STATE_COOKIE, '', cookieOptions(0));
    response.cookies.set(GITHUB_RETURN_COOKIE, '', cookieOptions(0));
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch {
    return fail('Erro inesperado ao conectar ao GitHub.');
  }
}
