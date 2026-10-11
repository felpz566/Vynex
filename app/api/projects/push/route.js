import { getGitHubSession, jsonError } from '../../../../src/lib/github-api.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REPO_NAME = /^[A-Za-z0-9_.-]{1,100}$/;
const MAX_FILES = 50;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;

async function githubRequest(token, path, method = 'GET', body) {
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'Vynex-Studio',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || 'A API do GitHub recusou a operação.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function validPath(path) {
  if (typeof path !== 'string' || !path || path.length > 240) return false;
  if (path.startsWith('/') || path.includes('\\') || path.includes('\0')) return false;
  const parts = path.split('/');
  return parts.every((part) => part && part !== '.' && part !== '..' && !part.startsWith('.git'));
}

export async function POST(request) {
  const session = getGitHubSession(request);
  if (!session) return jsonError('Entre com o GitHub antes de enviar o projeto.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError('O corpo da requisição precisa ser JSON válido.', 400);
  }

  const files = body?.files;
  const createRepository = body?.createRepository === true;
  const repoName = createRepository ? body?.newRepoName : body?.repository;
  const isPrivate = body?.private !== false;

  if (!REPO_NAME.test(repoName || '')) return jsonError('Nome de repositório inválido.', 400);
  if (!Array.isArray(files) || files.length === 0 || files.length > MAX_FILES) {
    return jsonError(`Envie de 1 a ${MAX_FILES} arquivos por envio.`, 400);
  }

  let totalBytes = 0;
  const seenPaths = new Set();
  for (const file of files) {
    if (!validPath(file?.path) || typeof file?.contentBase64 !== 'string') {
      return jsonError('Há um caminho ou conteúdo de arquivo inválido.', 400);
    }
    if (seenPaths.has(file.path)) return jsonError(`O arquivo "${file.path}" está duplicado.`, 400);
    seenPaths.add(file.path);
    if (file.contentBase64.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.contentBase64)) {
      return jsonError(`O arquivo "${file.path}" não contém Base64 válido.`, 400);
    }
    const bytes = Buffer.from(file.contentBase64, 'base64').length;
    if (bytes > MAX_FILE_BYTES) return jsonError(`O arquivo "${file.path}" excede 2 MB.`, 413);
    totalBytes += bytes;
    if (totalBytes > MAX_TOTAL_BYTES) return jsonError('O projeto excede o limite de 3 MB por envio.', 413);
  }

  const owner = createRepository ? session.login : String(body?.repositoryOwner || session.login);
  if (!/^[A-Za-z0-9-]{1,39}$/.test(owner)) return jsonError('Proprietário do repositório inválido.', 400);

  try {
    let repository;
    if (createRepository) {
      repository = await githubRequest(session.accessToken, '/user/repos', 'POST', {
        name: repoName,
        description: typeof body.description === 'string' ? body.description.slice(0, 350) : 'Criado com Vynex',
        private: isPrivate,
        auto_init: true,
      });
    } else {
      repository = await githubRequest(
        session.accessToken,
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repoName)}`,
      );
    }

    const defaultBranch = repository.default_branch || 'main';
    const encodedOwner = encodeURIComponent(repository.owner.login);
    const encodedRepo = encodeURIComponent(repository.name);
    const branchRef = await githubRequest(
      session.accessToken,
      `/repos/${encodedOwner}/${encodedRepo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
    );
    const parentSha = branchRef.object.sha;
    const parentCommit = await githubRequest(
      session.accessToken,
      `/repos/${encodedOwner}/${encodedRepo}/git/commits/${parentSha}`,
    );

    const blobs = await Promise.all(files.map(async (file) => {
      const blob = await githubRequest(
        session.accessToken,
        `/repos/${encodedOwner}/${encodedRepo}/git/blobs`,
        'POST',
        { content: file.contentBase64, encoding: 'base64' },
      );
      return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
    }));

    const tree = await githubRequest(
      session.accessToken,
      `/repos/${encodedOwner}/${encodedRepo}/git/trees`,
      'POST',
      { base_tree: parentCommit.tree.sha, tree: blobs },
    );
    const commit = await githubRequest(
      session.accessToken,
      `/repos/${encodedOwner}/${encodedRepo}/git/commits`,
      'POST',
      {
        message: typeof body.message === 'string' && body.message.trim()
          ? body.message.trim().slice(0, 200)
          : 'Update project with Vynex',
        tree: tree.sha,
        parents: [parentSha],
      },
    );
    await githubRequest(
      session.accessToken,
      `/repos/${encodedOwner}/${encodedRepo}/git/refs/heads/${encodeURIComponent(defaultBranch)}`,
      'PATCH',
      { sha: commit.sha },
    );

    return Response.json({
      success: true,
      repository: repository.full_name,
      url: repository.html_url,
      branch: defaultBranch,
      commit: commit.sha,
      filesPushed: files.length,
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 502;
    const message = status === 401
      ? 'A autorização expirou. Entre novamente com o GitHub.'
      : status === 403
        ? 'O GitHub não permitiu gravar neste repositório. Confira o acesso e o escopo repo.'
        : status === 404
          ? 'Repositório ou branch não encontrado.'
          : status === 422
            ? 'O GitHub recusou a operação. O repositório pode já existir ou a branch mudou.'
            : error?.message || 'Falha ao enviar o projeto para o GitHub.';
    return jsonError(message, status >= 400 && status < 600 ? status : 502);
  }
}
