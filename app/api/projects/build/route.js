import { getGitHubSession, jsonError } from '../../../../src/lib/github-api.js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_FILES = 50;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;
const SAFE_NAME = /^[A-Za-z0-9_.-]{1,100}$/;
const ALLOWED_EXTENSIONS = new Set([
  '.html', '.htm', '.css', '.js', '.mjs', '.cjs', '.json', '.txt', '.md',
  '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2',
  '.ttf', '.otf', '.mp3', '.wav', '.mp4', '.webm'
]);

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
    const error = new Error(data.message || 'O GitHub recusou a operação.');
    error.status = response.status;
    throw error;
  }
  return data;
}

function safePath(path) {
  if (typeof path !== 'string' || !path || path.length > 220 || path.startsWith('/') || path.includes('\\') || path.includes('\0')) return false;
  const parts = path.split('/');
  if (!parts.every((part) => part && part !== '.' && part !== '..' && !part.startsWith('.git'))) return false;
  if (parts.some((part) => part === 'node_modules' || part === '.github')) return false;
  const filename = parts.at(-1);
  const dot = filename.lastIndexOf('.');
  const ext = dot >= 0 ? filename.slice(dot).toLowerCase() : '';
  return ALLOWED_EXTENSIONS.has(ext) && path !== 'index.html' ? true : ALLOWED_EXTENSIONS.has(ext);
}

function workflowSource() {
  return `name: Vynex Windows Build
on:
  workflow_dispatch:
  push:
    paths:
      - 'app/**'
      - 'main.cjs'
      - 'package.json'
      - '.github/workflows/build.yml'
permissions:
  contents: read
jobs:
  build:
    runs-on: windows-latest
    timeout-minutes: 20
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - name: Install dependencies
        run: npm install
      - name: Package Windows installer
        run: npm run dist
      - name: Upload installer
        uses: actions/upload-artifact@v4
        with:
          name: vynex-windows-installer
          path: dist/*.exe
          if-no-files-found: error
          retention-days: 3
`;
}

export async function POST(request) {
  const session = getGitHubSession(request);
  if (!session) return jsonError('Conecte o GitHub para usar o compilador na nuvem. O Vynex não exige VS Code nem ferramentas locais.', 401);

  let body;
  try { body = await request.json(); } catch { return jsonError('Envie um JSON válido.', 400); }
  const projectName = String(body?.projectName || 'vynex-app').trim().replace(/[^A-Za-z0-9_.-]/g, '-').replace(/-+/g, '-').slice(0, 55);
  const files = body?.files;
  if (!Array.isArray(files) || files.length < 1 || files.length > MAX_FILES) {
    return jsonError(`O projeto precisa ter entre 1 e ${MAX_FILES} arquivos.`, 400);
  }

  let totalBytes = 0;
  const seen = new Set();
  let hasIndex = false;
  for (const file of files) {
    if (!safePath(file?.path) || typeof file?.contentBase64 !== 'string' || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(file.contentBase64)) {
      return jsonError('O projeto contém um caminho, extensão ou arquivo inválido. Este primeiro compilador aceita projetos web HTML/CSS/JS.', 400);
    }
    if (seen.has(file.path)) return jsonError(`O caminho "${file.path}" está duplicado.`, 400);
    seen.add(file.path);
    if (file.path === 'index.html') hasIndex = true;
    const size = Buffer.from(file.contentBase64, 'base64').length;
    if (size > MAX_FILE_BYTES) return jsonError(`"${file.path}" excede 2 MB.`, 413);
    totalBytes += size;
    if (totalBytes > MAX_TOTAL_BYTES) return jsonError('O projeto excede 3 MB no total.', 413);
  }
  if (!hasIndex) return jsonError('Adicione um index.html na raiz do projeto antes de compilar.', 400);

  const repoName = `vynex-build-${projectName.toLowerCase().replace(/[^a-z0-9_.-]/g, '-').slice(0, 45)}-${Date.now().toString(36)}`.slice(0, 100);
  const generatedPackage = JSON.stringify({
    name: 'vynex-desktop-app',
    version: '1.0.0',
    private: true,
    description: `Desktop app built with Vynex: ${projectName}`,
    main: 'main.cjs',
    scripts: { dist: 'electron-builder --win nsis --x64' },
    devDependencies: { electron: '^36.0.0', 'electron-builder': '^26.0.0' },
    build: {
      appId: 'studio.vynex.desktop',
      productName: projectName.replace(/[^A-Za-z0-9 _-]/g, '').slice(0, 60) || 'Vynex App',
      directories: { output: 'dist' },
      files: ['main.cjs', 'app/**/*', 'package.json'],
      win: { target: ['nsis'], artifactName: '${projectName}-Setup-${version}.${ext}' },
      nsis: { oneClick: true, perMachine: false, allowToChangeInstallationDirectory: false, createDesktopShortcut: true, createStartMenuShortcut: true }
    }
  }, null, 2);
  const mainSource = `const { app, BrowserWindow } = require('electron');
const path = require('node:path');

function createWindow() {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 360,
    minHeight: 560,
    backgroundColor: '#111319',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  window.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
`;

  try {
    const repo = await githubRequest(session.accessToken, '/user/repos', 'POST', {
      name: repoName,
      description: `Private temporary build workspace generated by Vynex for ${projectName}`,
      private: true,
      auto_init: true,
    });
    const owner = encodeURIComponent(repo.owner.login);
    const name = encodeURIComponent(repo.name);
    const branch = repo.default_branch || 'main';
    const ref = await githubRequest(session.accessToken, `/repos/${owner}/${name}/git/ref/heads/${encodeURIComponent(branch)}`);
    const parent = await githubRequest(session.accessToken, `/repos/${owner}/${name}/git/commits/${ref.object.sha}`);
    const sourceFiles = files.map((file) => ({ path: `app/${file.path}`, content: file.contentBase64, encoding: 'base64' }));
    sourceFiles.push(
      { path: 'package.json', content: generatedPackage, encoding: 'utf-8' },
      { path: 'main.cjs', content: mainSource, encoding: 'utf-8' },
      { path: '.github/workflows/build.yml', content: workflowSource(), encoding: 'utf-8' },
      { path: '.gitignore', content: 'node_modules/\ndist/\nrelease/\n', encoding: 'utf-8' }
    );
    const blobs = await Promise.all(sourceFiles.map(async (file) => {
      const blob = await githubRequest(session.accessToken, `/repos/${owner}/${name}/git/blobs`, 'POST', {
        content: file.content,
        encoding: file.encoding,
      });
      return { path: file.path, mode: '100644', type: 'blob', sha: blob.sha };
    }));
    const tree = await githubRequest(session.accessToken, `/repos/${owner}/${name}/git/trees`, 'POST', {
      base_tree: parent.tree.sha,
      tree: blobs,
    });
    const commit = await githubRequest(session.accessToken, `/repos/${owner}/${name}/git/commits`, 'POST', {
      message: 'Prepare Windows desktop build with Vynex',
      tree: tree.sha,
      parents: [ref.object.sha],
    });
    await githubRequest(session.accessToken, `/repos/${owner}/${name}/git/refs/heads/${encodeURIComponent(branch)}`, 'PATCH', { sha: commit.sha });
    await githubRequest(session.accessToken, `/repos/${owner}/${name}/actions/workflows/build.yml/dispatches`, 'POST', { ref: branch });
    return Response.json({
      success: true,
      repository: repo.full_name,
      repositoryUrl: repo.html_url,
      projectName,
      message: 'Build iniciado. Você pode acompanhar o progresso nesta página.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 502;
    const message = status === 401
      ? 'Sua sessão do GitHub expirou. Reconecte a conta e tente novamente.'
      : status === 403
        ? 'O GitHub não permitiu criar o ambiente de compilação. Reautorize o Vynex com as permissões de repositório e Actions.'
        : status === 422
          ? 'O GitHub recusou a criação ou o disparo do build. Confira as permissões do GitHub Actions.'
          : error?.message || 'Não foi possível iniciar a compilação.';
    return jsonError(message, status >= 400 && status < 600 ? status : 502);
  }
}
