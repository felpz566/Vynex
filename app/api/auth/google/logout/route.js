import { NextResponse } from 'next/server';
import { cloudCookieOptions, CLOUD_SESSION_COOKIE, GOOGLE_STATE_COOKIE } from '../../../../../src/lib/cloud-session.js';

export const runtime = 'nodejs';

export async function POST(request) {
  const response = NextResponse.redirect(new URL('/login?logged_out=1', request.url), 303);
  response.cookies.set(CLOUD_SESSION_COOKIE, '', cloudCookieOptions(0));
  response.cookies.set(GOOGLE_STATE_COOKIE, '', cloudCookieOptions(0));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
