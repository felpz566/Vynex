import { getGitHubSession } from '../../../../../src/lib/github-api.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = getGitHubSession(request);
  return Response.json(
    {
      configured: Boolean(
        process.env.GITHUB_APP_CLIENT_ID
        && process.env.GITHUB_APP_CLIENT_SECRET
        && process.env.GITHUB_APP_CALLBACK_URL
        && process.env.GITHUB_SESSION_SECRET
      ),
      connected: Boolean(session),
      ...(session ? { account: session.login, avatarUrl: session.avatarUrl } : {}),
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
