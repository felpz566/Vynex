import { decryptCloudSession, CLOUD_SESSION_COOKIE } from '../../../../../src/lib/cloud-session.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  let session = null;
  try {
    session = decryptCloudSession(request.cookies.get(CLOUD_SESSION_COOKIE)?.value);
  } catch {
    session = null;
  }

  return Response.json({
    configured: Boolean(
      process.env.GOOGLE_OAUTH_CLIENT_ID
      && process.env.GOOGLE_OAUTH_CLIENT_SECRET
      && process.env.GOOGLE_OAUTH_CALLBACK_URL
      && process.env.CLOUD_SESSION_SECRET
    ),
    connected: Boolean(session),
    ...(session ? {
      provider: session.provider,
      email: session.email,
      name: session.name,
      avatarUrl: session.avatarUrl,
    } : {}),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
