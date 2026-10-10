import { decryptSession, GITHUB_SESSION_COOKIE } from './github-session.js';

export function getGitHubSession(request) {
  return decryptSession(request.cookies.get(GITHUB_SESSION_COOKIE)?.value);
}

export async function githubFetch(accessToken, path) {
  return fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${accessToken}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Vynex-Studio',
    },
    cache: 'no-store',
  });
}

export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}
