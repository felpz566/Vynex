import { getGitHubSession, jsonError } from '../../../../../src/lib/github-api.js';

export const dynamic = 'force-dynamic';

const SAFE_SEGMENT = /^[A-Za-z0-9_.-]{1,100}$/;
const SAFE_REF = /^[A-Za-z0-9_./-]{1,200}$/;

export async function GET(request) {
  const session = getGitHubSession(request);
  if (!session) return jsonError('Conecte sua conta do GitHub primeiro.', 401);

  const url = new URL(request.url);
  const owner = url.searchParams.get('owner') ?? '';
  const repo = url.searchParams.get('repo') ?? '';
  const ref = url.searchParams.get('ref') ?? '';

  if (!SAFE_SEGMENT.test(owner) || !SAFE_SEGMENT.test(repo) || !SAFE_REF.test(ref)
      || ref.startsWith('/') || ref.includes('..') || ref.startsWith('-')) {
    return jsonError('Informe owner, repo e ref válidos.', 400);
  }

  try {
    const encodedRef = ref.split('/').map(encodeURIComponent).join('/');
    const archiveUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/zipball/${encodedRef}`;
    const upstream = await fetch(archiveUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${session.accessToken}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Vynex-Studio',
      },
      cache: 'no-store',
      redirect: 'follow',
    });

    if (upstream.status === 401) return jsonError('A autorização do GitHub expirou. Conecte novamente.', 401);
    if (upstream.status === 404) return jsonError('Repositório ou branch não encontrado, ou sem permissão de leitura.', 404);
    if (!upstream.ok || !upstream.body) return jsonError('O GitHub não conseguiu gerar o arquivo ZIP.', 502);

    const filename = `${owner}-${repo}`.replace(/[^A-Za-z0-9_.-]/g, '_').slice(0, 180);
    const headers = new Headers({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}.zip"`,
      'Cache-Control': 'no-store, private',
      'X-Content-Type-Options': 'nosniff',
    });
    const length = upstream.headers.get('content-length');
    if (length) headers.set('Content-Length', length);

    return new Response(upstream.body, { status: 200, headers });
  } catch {
    return jsonError('Falha ao exportar o repositório. Tente novamente.', 502);
  }
}
