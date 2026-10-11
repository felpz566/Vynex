import { getGitHubSession, jsonError } from '../../../../../src/lib/github-api.js';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SAFE_SEGMENT = /^[A-Za-z0-9_.-]{1,100}$/;
const SAFE_ID = /^\d{1,20}$/;

export async function GET(request) {
  const session = getGitHubSession(request);
  if (!session) return jsonError('Conecte o GitHub para baixar o instalador.', 401);
  const url = new URL(request.url);
  const parts = (url.searchParams.get('repo') || '').split('/');
  const artifactId = url.searchParams.get('artifact') || '';
  if (parts.length !== 2 || !SAFE_SEGMENT.test(parts[0]) || !SAFE_SEGMENT.test(parts[1]) || !SAFE_ID.test(artifactId)) {
    return jsonError('Dados do download inválidos.', 400);
  }
  try {
    const endpoint = `https://api.github.com/repos/${encodeURIComponent(parts[0])}/${encodeURIComponent(parts[1])}/actions/artifacts/${artifactId}/zip`;
    const upstream = await fetch(endpoint, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${session.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Vynex-Studio',
      },
      cache: 'no-store',
      redirect: 'follow',
    });
    if (!upstream.ok || !upstream.body) return jsonError('O instalador expirou ou não está disponível. Execute o build novamente.', upstream.status === 404 ? 404 : 502);
    return new Response(upstream.body, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="vynex-windows-installer.zip"',
        'Cache-Control': 'no-store, private',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return jsonError('Falha ao baixar o artefato do build.', 502);
  }
}
