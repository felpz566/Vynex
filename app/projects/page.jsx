'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, Check, CloudUpload, FileCode2, FilePlus2, FolderOpen,
  Github, HardDrive, LoaderCircle, LockKeyhole, Plus, RefreshCw,
  Save, Search, Upload, X,
} from 'lucide-react';
import './projects.css';

const STORAGE_KEY = 'vynex.projects.v1';

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function starterProject(name = 'meu-projeto') {
  return {
    id: `project-${Date.now()}`,
    name,
    description: 'Meu primeiro projeto criado com Vynex',
    files: [
      {
        path: 'README.md',
        contentBase64: btoa(unescape(encodeURIComponent(`# ${name}\n\nProjeto criado com Vynex.\n\nComece editando os arquivos e envie para o GitHub quando estiver pronto.\n`))),
        size: 0,
      },
      {
        path: 'index.html',
        contentBase64: btoa(unescape(encodeURIComponent('<!doctype html>\n<html lang="pt-BR">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Meu projeto</title>\n</head>\n<body>\n  <main><h1>Olá, mundo!</h1><p>Este projeto começou no Vynex.</p></main>\n</body>\n</html>\n')),
        size: 0,
      },
    ],
    updatedAt: Date.now(),
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  const [statusLoading, setStatusLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('meu-projeto');
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState('new');
  const [targetRepo, setTargetRepo] = useState('');
  const [privateRepo, setPrivateRepo] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [resultUrl, setResultUrl] = useState('');
  const fileInput = useRef(null);
  const folderInput = useRef(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) {
        setProjects(saved);
        if (saved[0]?.id) setActiveId(saved[0].id);
      }
    } catch {
      setProjects([]);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch {
      setError('O navegador ficou sem espaço para salvar este rascunho local. Envie para o GitHub para guardar o projeto.');
    }
  }, [projects]);

  const activeProject = projects.find((project) => project.id === activeId) || null;

  const loadGitHub = useCallback(async () => {
    setStatusLoading(true);
    try {
      const statusResponse = await fetch('/api/integrations/github/status', { cache: 'no-store' });
      const status = await statusResponse.json();
      setConnected(Boolean(status.connected));
      setAccount(status.account || '');
      if (status.connected) {
        const repoResponse = await fetch('/api/integrations/github/repos', { cache: 'no-store' });
        const repoData = await repoResponse.json();
        if (!repoResponse.ok) throw new Error(repoData.error || 'Não foi possível carregar os repositórios.');
        setRepositories(repoData);
        setTargetRepo((current) => current || repoData[0]?.fullName || '');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao conectar ao GitHub.');
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGitHub();
    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'connected') setNotice('GitHub conectado com sucesso.');
    if (params.get('github') === 'error') setError('Não foi possível conectar ao GitHub. Tente novamente.');
    if (params.has('github')) window.history.replaceState({}, '', '/projects');
  }, [loadGitHub]);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => !query || project.name.toLowerCase().includes(query));
  }, [projects, search]);

  const createProject = (event) => {
    event.preventDefault();
    const name = newName.trim().replace(/[^A-Za-z0-9_. -]/g, '').slice(0, 80);
    if (!name) return;
    const project = starterProject(name);
    setProjects((current) => [project, ...current]);
    setActiveId(project.id);
    setShowCreate(false);
    setNewName('meu-projeto');
    setError('');
    setNotice(`Projeto "${name}" criado.`);
  };

  const importFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;
    if (!activeProject) {
      setError('Crie ou selecione um projeto antes de importar arquivos.');
      return;
    }
    const existingPaths = new Set(activeProject.files.map((file) => file.path));
    const incoming = [];
    for (const file of selected) {
      const rawPath = file.webkitRelativePath || file.name;
      const path = rawPath.split('/').map((part) => part.trim()).filter(Boolean).join('/');
      if (!path || path.startsWith('.') || path.split('/').some((part) => part === '..')) continue;
      if (file.size > 2 * 1024 * 1024) {
        setError(`"${path}" excede o limite de 2 MB por arquivo.`);
        continue;
      }
      if (existingPaths.has(path)) {
        setError(`"${path}" já existe no projeto; remova o arquivo anterior antes de importar outro com o mesmo caminho.`);
        continue;
      }
      const buffer = await file.arrayBuffer();
      incoming.push({ path, contentBase64: toBase64(buffer), size: file.size });
      existingPaths.add(path);
    }
    if (incoming.length) {
      setProjects((current) => current.map((project) => project.id === activeId
        ? { ...project, files: [...project.files, ...incoming], updatedAt: Date.now() }
        : project));
      setNotice(`${incoming.length} arquivo(s) importado(s).`);
      setError('');
    }
  };

  const removeFile = (path) => {
    setProjects((current) => current.map((project) => project.id === activeId
      ? { ...project, files: project.files.filter((file) => file.path !== path), updatedAt: Date.now() }
      : project));
  };

  const pushProject = async () => {
    if (!activeProject) return;
    if (!connected) {
      window.location.href = '/api/integrations/github/start?next=%2Fprojects';
      return;
    }
    if (!activeProject.files.length) {
      setError('Adicione pelo menos um arquivo antes de enviar.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    setResultUrl('');
    try {
      const response = await fetch('/api/projects/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createRepository: target === 'new',
          newRepoName: activeProject.name.toLowerCase().replace(/[^a-z0-9_.-]/g, '-').replace(/-+/g, '-').slice(0, 100),
          repository: target === 'existing' ? targetRepo.split('/').slice(1).join('/') : undefined,
          repositoryOwner: target === 'existing' ? targetRepo.split('/')[0] : account,
          private: privateRepo,
          description: activeProject.description,
          message: `Update ${activeProject.name} with Vynex`,
          files: activeProject.files.map(({ path, contentBase64 }) => ({ path, contentBase64 })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Falha ao enviar projeto.');
      setNotice(`Push concluído: ${data.filesPushed} arquivo(s) em ${data.repository} (${data.branch}).`);
      setResultUrl(data.url);
      await loadGitHub();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o projeto.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="projects-shell">
      <header className="projects-topbar">
        <a className="projects-back" href="/"><ArrowLeft size={17}/> Vynex</a>
        <div className="projects-top-title"><span className="projects-mark">V</span><b>Projetos</b><span className="projects-slash">/ workspace</span></div>
        <div className="projects-account">
          {connected ? <><span className="projects-live-dot"/> @{account}</> : <a href="/api/integrations/github/start?next=%2Fprojects"><Github size={15}/> Entrar com GitHub</a>}
        </div>
      </header>

      <div className="projects-layout">
        <aside className="projects-sidebar">
          <div className="projects-sidebar-head"><span>SEUS PROJETOS</span><button aria-label="Novo projeto" onClick={() => setShowCreate(true)}><Plus size={16}/></button></div>
          <label className="projects-filter"><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar projeto"/></label>
          <div className="projects-list">
            {filteredProjects.map((project) => (
              <button key={project.id} className={project.id === activeId ? 'projects-list-item active' : 'projects-list-item'} onClick={() => { setActiveId(project.id); setError(''); }}>
                <FolderOpen size={16}/><span>{project.name}</span><small>{project.files.length}</small>
              </button>
            ))}
            {filteredProjects.length === 0 && <p className="projects-empty-side">Ainda não há projetos. Crie um do zero ou importe seus arquivos.</p>}
          </div>
          <div className="projects-sidebar-bottom"><HardDrive size={15}/><span>Rascunhos salvos neste dispositivo</span></div>
        </aside>

        <section className="projects-main">
          <div className="projects-page-heading">
            <div><span className="projects-eyebrow">WORKSPACE</span><h1>{activeProject?.name || 'Seus projetos'}</h1><p>Crie do zero, importe arquivos do computador/celular ou envie para o GitHub.</p></div>
            <button className="projects-new-button" onClick={() => setShowCreate(true)}><FilePlus2 size={16}/> Novo projeto</button>
          </div>

          {!activeProject ? (
            <div className="projects-welcome">
              <div className="projects-welcome-icon"><FileCode2 size={28}/></div>
              <h2>Vamos começar algo novo?</h2>
              <p>Crie um projeto vazio com arquivos iniciais ou importe uma pasta existente do seu dispositivo.</p>
              <div className="projects-welcome-actions"><button onClick={() => setShowCreate(true)}><Plus size={16}/> Criar do zero</button><button className="secondary" onClick={() => fileInput.current?.click()}><Upload size={16}/> Importar arquivos</button></div>
            </div>
          ) : (
            <>
              <div className="projects-actions-row">
                <div className="projects-action-copy"><span className="projects-action-icon"><FolderOpen size={18}/></span><div><b>Arquivos do projeto</b><small>{activeProject.files.length} arquivo(s) · salvos no navegador</small></div></div>
                <div className="projects-file-actions">
                  <button onClick={() => fileInput.current?.click()}><Upload size={15}/> Arquivos</button>
                  <button onClick={() => folderInput.current?.click()}><FolderOpen size={15}/> Pasta</button>
                  <button onClick={() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(projects)); setNotice('Rascunho salvo neste dispositivo.'); } catch { setError('Não há espaço suficiente no armazenamento local.'); } }}><Save size={15}/> Salvar</button>
                </div>
              </div>

              <div className="projects-file-table">
                {activeProject.files.map((file) => (
                  <div className="projects-file-row" key={file.path}>
                    <span className="projects-file-icon"><FileCode2 size={17}/></span>
                    <span className="projects-file-path">{file.path}</span>
                    <span className="projects-file-size">{file.size ? file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB` : 'Arquivo'}</span>
                    <button aria-label={`Remover ${file.path}`} onClick={() => removeFile(file.path)}><X size={15}/></button>
                  </div>
                ))}
                {activeProject.files.length === 0 && <div className="projects-no-files">Nenhum arquivo. Use “Arquivos” ou “Pasta” para importar.</div>}
                <button className="projects-dropzone" onClick={() => fileInput.current?.click()}><CloudUpload size={22}/><b>Adicionar arquivos do dispositivo</b><span>Computador ou celular · até 2 MB por arquivo</span></button>
              </div>

              <section className="projects-push-panel">
                <div className="projects-push-heading"><div className="projects-github-icon"><Github size={19}/></div><div><h2>Enviar para o GitHub</h2><p>Crie um repositório ou faça push para um repositório existente.</p></div></div>
                {!connected ? (
                  <div className="projects-connect-callout"><p>Conecte sua conta para criar repositórios e enviar código.</p><a href="/api/integrations/github/start?next=%2Fprojects"><Github size={16}/> Entrar com GitHub</a></div>
                ) : (
                  <>
                    <div className="projects-target-options">
                      <label className={target === 'new' ? 'projects-target-option selected' : 'projects-target-option'}><input type="radio" name="target" checked={target === 'new'} onChange={() => setTarget('new')}/><span><Plus size={15}/><b>Criar repositório</b><small>Na conta @{account}</small></span></label>
                      <label className={target === 'existing' ? 'projects-target-option selected' : 'projects-target-option'}><input type="radio" name="target" checked={target === 'existing'} onChange={() => setTarget('existing')}/><span><Github size={15}/><b>Repositório existente</b><small>Enviar para branch padrão</small></span></label>
                    </div>
                    {target === 'existing' && <label className="projects-field"><span>Repositório</span><select value={targetRepo} onChange={(event) => setTargetRepo(event.target.value)}>{repositories.map((repo) => <option key={repo.id} value={repo.fullName}>{repo.fullName}{repo.private ? ' · privado' : ''}</option>)}</select></label>}
                    {target === 'new' && <label className="projects-private-check"><input type="checkbox" checked={privateRepo} onChange={(event) => setPrivateRepo(event.target.checked)}/><LockKeyhole size={15}/> Criar como repositório privado</label>}
                    <button className="projects-push-button" onClick={pushProject} disabled={busy || !activeProject.files.length || (target === 'existing' && !targetRepo)}>{busy ? <><LoaderCircle className="projects-spin" size={17}/> Enviando...</> : <><CloudUpload size={17}/> Fazer push para o GitHub</>}</button>
                    <p className="projects-safety-note"><LockKeyhole size={13}/> Token protegido no servidor. Limite: 50 arquivos, 2 MB por arquivo e 12 MB por envio.</p>
                  </>
                )}
              </section>
            </>
          )}

          {statusLoading && <div className="projects-status-note"><RefreshCw className="projects-spin" size={14}/> Verificando GitHub...</div>}
          {notice && <div className="projects-notice"><Check size={15}/><span>{notice}{resultUrl && <> <a href={resultUrl} target="_blank" rel="noreferrer">Abrir repositório</a></>}</span><button onClick={() => { setNotice(''); setResultUrl(''); }}><X size={14}/></button></div>}
          {error && <div className="projects-error">{error}<button onClick={() => setError('')}><X size={14}/></button></div>}
        </section>
      </div>

      <input ref={fileInput} className="projects-hidden-input" type="file" multiple onChange={importFiles}/>
      <input ref={folderInput} className="projects-hidden-input" type="file" multiple webkitdirectory="" onChange={importFiles}/>

      {showCreate && <div className="projects-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setShowCreate(false); }}><form className="projects-modal" onSubmit={createProject}><button type="button" className="projects-modal-close" onClick={() => setShowCreate(false)} aria-label="Fechar"><X size={18}/></button><span className="projects-eyebrow">NOVO WORKSPACE</span><h2>Criar projeto</h2><p>O Vynex cria uma estrutura inicial simples que você pode completar com seus próprios arquivos.</p><label className="projects-field"><span>Nome do projeto</span><input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={80} required placeholder="meu-projeto"/></label><div className="projects-modal-actions"><button type="button" onClick={() => setShowCreate(false)}>Cancelar</button><button type="submit"><Plus size={15}/> Criar projeto</button></div></form></div>}
    </main>
  );
}
