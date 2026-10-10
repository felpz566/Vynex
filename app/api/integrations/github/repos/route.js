import { getGitHubSession, githubFetch, jsonError } from '../../../../../src/lib/github-api.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const session = getGitHubSession(request);
  if (!session) return jsonError('Conecte sua conta do GitHub primeiro.', 401);

  const response = await githubFetch(
    session.accessToken,
    '/user/repos?visibility=all&affiliation=owner%2Ccollaborator%2Corganization_member&sort=updated&per_page=100',
  );

  if (response.status === 401) return jsonError('A autorização do GitHub expirou. Conecte novamente.', 401);
  if (!response.ok) return jsonError('Não foi possível listar os repositórios do GitHub.', 502);

  const repositories = await response.json();
  return Response.json(
    repositories.map((repo) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: repo.owner.login,
      private: repo.private,
      description: repo.description,
      defaultBranch: repo.default_branch,
      url: repo.html_url,
      updatedAt: repo.updated_at,
    })),
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
