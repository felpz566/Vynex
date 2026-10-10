import { getGitHubSession } from '../../../../../src/lib/github-api.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = getGitHubSession(request);
  return Response.json(
    session
      ? { connected: true, account: session.login, avatarUrl: session.avatarUrl }
      : { connected: false },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
