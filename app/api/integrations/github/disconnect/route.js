import { NextResponse } from 'next/server';
import { cookieOptions, GITHUB_SESSION_COOKIE } from '../../../../../src/lib/github-session.js';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json({ connected: false });
  response.cookies.set(GITHUB_SESSION_COOKIE, '', cookieOptions(0));
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
