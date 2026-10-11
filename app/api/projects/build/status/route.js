import { getGitHubSession, jsonError } from '../../../../../src/lib/github-api.js';

export const dynamic = 'force-dynamic';

const SAFE_SEGMENT = /^[A-Za-z0-9_.-]{1,100}$/;

export async function GET(request) {
  const session = getGitHubSession(request);
  if (!session) return jsonError('Conecte o GitHub para acompanhar a compilação.', 401);
  const url = new URL(request.url);
  const parts = (url.searchParams.get('repo') || '').split('/');
  if (parts.length !== 2 || !SAFE_SEGMENT.test(parts[0]) || !SAFE_SEGMENT.test(parts[1])) {
    return jsonError('Repositório de build inválido.', 400);
  }
  const [owner, repo] = parts.map(encodeURIComponent);
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${session.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Vynex-Studio',
      },
      cache: 'no-store',
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return jsonError(response.status === 404 ? 'Build não encontrado ou sem permissão de leitura.' : 'Não foi possível consultar o status do build.', response.status === 401 ? 401 : 502);
    const run = (data.workflow_runs || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    if (!run) return Response.json({ status: 'queued', conclusion: null, runUrl: null, artifactId: null }, { headers: { 'Cache-Control': 'no-store' } });
    let artifactId = null;
    if (run.status === 'completed' && run.conclusion === 'success') {
      const artifactResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${run.id}/artifacts`, {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${session.accessToken}`,
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'Vynex-Studio',
        },
        cache: 'no-store',
      });
      if (artifactResponse.ok) {
        const artifactData = await artifactResponse.json();
        artifactId = artifactData.artifacts?.find((item) => item.name === 'vynex-windows-installer' && !item.expired)?.id ?? null;
      }
    }
    return Response.json({
      status: run.status,
      conclusion: run.conclusion,
      runUrl: run.html_url,
      runId: run.id,
      artifactId,
      updatedAt: run.updated_at,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return jsonError('Falha ao consultar o status da compilação.', 502);
  }
}
