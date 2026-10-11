import { getGitHubSession, githubFetch, jsonError } from '../../../../../src/lib/github-api.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SAFE_SEGMENT = /^[A-Za-z0-9_.-]{1,100}$/;
const MAX_FILES = 50;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;

function validPath(path) {
  if (typeof path !== 'string' || !path || path.length > 240) return false;
  if (path.startsWith('/') || path.includes(String.fromCharCode(92)) || path.includes(String.fromCharCode(0))) return false;
  return path.split('/').every((part) => part && part !== '.' && part !== '..' && !part.startsWith('.git'));
}

async function readJson(response, message) {
  if (response.status === 401) throw Object.assign(new Error('A autorização do GitHub expirou. Conecte novamente.'), { status: 401 });
  if (!response.ok) throw Object.assign(new Error(message), { status: response.status });
  return response.json();
}

export async function POST(request) {
  const session = getGitHubSession(request);
  if (!session) return jsonError('Conecte sua conta do GitHub antes de importar.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('O corpo da requisição precisa ser JSON válido.', 400);
  }

  const owner = String(body?.owner || '');
  const repo = String(body?.repo || '');
  const branch = String(body?.branch || '');
  if (!SAFE_SEGMENT.test(owner) || !SAFE_SEGMENT.test(repo) || !branch || branch.length > 200 || branch.startsWith('/') || branch.includes('..')) {
    return jsonError('Repositório ou branch inválido.', 400);
  }

  try {
    const encodedBranch = branch.split('/').map(encodeURIComponent).join('/');
    const refResponse = await githubFetch(session.accessToken, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/ref/heads/${encodedBranch}`);
    const refData = await readJson(refResponse, 'Não foi possível encontrar a branch selecionada.');
    const commitSha = refData?.object?.sha;
    if (!commitSha) return jsonError('Não foi possível encontrar o commit da branch.', 404);

    const commitResponse = await githubFetch(session.accessToken, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/commits/${encodeURIComponent(commitSha)}`);
    const commitData = await readJson(commitResponse, 'Não foi possível ler o commit da branch.');
    const treeSha = commitData?.tree?.sha;
    if (!treeSha) return jsonError('O repositório não contém uma árvore válida.', 422);

    const treeResponse = await githubFetch(session.accessToken, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(treeSha)}?recursive=1`);
    const treeData = await readJson(treeResponse, 'Não foi possível listar os arquivos do repositório.');
    if (treeData.truncated) return jsonError('Este repositório é grande demais para importar de uma só vez.', 413);

    const entries = (treeData.tree || []).filter((entry) => entry.type === 'blob' && validPath(entry.path));
    if (!entries.length) return jsonError('Não foram encontrados arquivos compatíveis para importar.', 422);
    if (entries.length > MAX_FILES) return jsonError(`O repositório tem ${entries.length} arquivos. O limite atual é ${MAX_FILES}.`, 413);

    let totalBytes = 0;
    for (const entry of entries) {
      if (typeof entry.size === 'number' && entry.size > MAX_FILE_BYTES) {
        return jsonError(`O arquivo "${entry.path}" excede 2 MB.`, 413);
      }
      totalBytes += Number(entry.size || 0);
      if (totalBytes > MAX_TOTAL_BYTES) return jsonError('O repositório excede o limite de 3 MB por importação.', 413);
    }

    const files = [];
    for (let offset = 0; offset < entries.length; offset += 5) {
      const batch = entries.slice(offset, offset + 5);
      const loaded = await Promise.all(batch.map(async (entry) => {
        const response = await githubFetch(session.accessToken, `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/blobs/${encodeURIComponent(entry.sha)}`);
        const blob = await readJson(response, `Não foi possível baixar "${entry.path}".`);
        if (blob.encoding !== 'base64' || typeof blob.content !== 'string') {
          throw Object.assign(new Error(`Formato de conteúdo não suportado em "${entry.path}".`), { status: 422 });
        }
        const contentBase64 = blob.content.replace(/\\s/g, '');
        const size = Buffer.from(contentBase64, 'base64').length;
        if (size > MAX_FILE_BYTES) throw Object.assign(new Error(`O arquivo "${entry.path}" excede 2 MB.`), { status: 413 });
        return { path: entry.path, contentBase64, size };
      }));
      files.push(...loaded);
    }

    return Response.json({
      name: repo,
      description: `Importado de ${owner}/${repo} (${branch})`,
      source: { owner, repo, branch },
      files,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = Number(error?.status) || 502;
    return jsonError(error instanceof Error ? error.message : 'Falha ao importar repositório.', status);
  }
}
