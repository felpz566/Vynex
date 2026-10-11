'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, ExternalLink, Github, Import, LoaderCircle, LockKeyhole, RefreshCw, Search, ShieldCheck, Unplug } from 'lucide-react';
import './github.css';

export default function GitHubWorkspacePage() {
  const [status, setStatus] = useState(null);
  const [repositories, setRepositories] = useState([]);
  const [query, setQuery] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState('');

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/integrations/github/status', { cache: 'no-store' });
      const data = await response.json();
      setStatus(data);
      if (data.connected) {
        setLoadingRepos(true);
        const repoResponse = await fetch('/api/integrations/github/repos', { cache: 'no-store' });
        const repoData = await repoResponse.json();
        if (!repoResponse.ok) throw new Error(repoData.error || 'Não foi possível carregar os repositórios.');
        setRepositories(repoData);
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao consultar o GitHub.');
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('github') === 'error') setError('Não foi possível conectar. Confira a configuração da integração e tente novamente.');
    if (params.has('github')) {
      window.history.replaceState({}, '', '/github');
    }
  }, [loadStatus]);

  const filteredRepositories = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return repositories;
    return repositories.filter((repo) =>
      repo.fullName.toLowerCase().includes(normalized)
      || (repo.description || '').toLowerCase().includes(normalized),
    );
  }, [repositories, query]);

  const importRepository = async (repo) => {
    setImporting(repo.fullName);
    setError('');
    try {
      const response = await fetch('/api/integrations/github/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner: repo.owner, repo: repo.name, branch: repo.defaultBranch }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível importar este repositório.');

      const storageKey = 'vynex.projects.v1';
      const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
      if (!Array.isArray(saved)) throw new Error('Os projetos salvos neste navegador estão inválidos.');
      const project = {
        id: 'github-' + repo.id + '-' + Date.now(),
        name: data.name,
        description: data.description,
        files: data.files,
        updatedAt: Date.now(),
        source: data.source,
      };
      localStorage.setItem(storageKey, JSON.stringify([project, ...saved]));
      window.location.href = '/projects?imported=' + encodeURIComponent(repo.fullName);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar o repositório.');
      setImporting('');
    }
  };

  const disconnect = async () => {
    await fetch('/api/integrations/github/disconnect', { method: 'POST' });
    setRepositories([]);
    setStatus((current) => ({ ...current, connected: false }));
  };

  return (
    <main className="github-workspace">
      <header className="github-topbar">
        <a className="github-back" href="/"><ArrowLeft size={17}/> Voltar ao Vynex</a>
        <span className="github-brand"><span className="github-brand-mark">V</span> Vynex <span>/ Git Export</span></span>
      </header>

      <section className="github-content">
        <div className="github-heading">
          <div className="github-eyebrow"><Github size={15}/> INTEGRAÇÃO DE REPOSITÓRIOS</div>
          <h1>Seus repositórios.<br/><span>Importe e continue.</span></h1>
          <p>Importe os arquivos de um repositório diretamente para o workspace do Vynex para continuar editando. O download ZIP também continua disponível.</p>
        </div>

        {!status ? (
          <div className="github-panel github-loading"><RefreshCw className="github-spin" size={20}/> Verificando conexão...</div>
        ) : !status.configured ? (
          <div className="github-panel">
            <div className="github-panel-icon"><LockKeyhole size={21}/></div>
            <h2>Falta configurar a integração</h2>
            <p>Adicione as variáveis do OAuth App na Vercel e publique um novo deploy. Os nomes e URLs estão documentados no README do repositório.</p>
            <a className="github-secondary-button" href="https://github.com/felpz566/Vynex#github-repository-connection-and-zip-export" target="_blank" rel="noreferrer">Ver instruções <ExternalLink size={15}/></a>
          </div>
        ) : !status.connected ? (
          <div className="github-panel github-connect-panel">
            <div className="github-panel-icon"><Github size={23}/></div>
            <h2>Conecte sua conta GitHub</h2>
            <p>O Vynex solicita o escopo repo para ler repositórios privados e enviar arquivos por push. Confira as permissões na tela de autorização antes de continuar.</p>
            <a className="github-primary-button" href="/api/integrations/github/start"><Github size={17}/> Conectar com GitHub</a>
            <div className="github-security-note"><ShieldCheck size={15}/> Token protegido no servidor; nunca exibido no navegador.</div>
          </div>
        ) : (
          <>
            <div className="github-connected-banner">
              <div className="github-avatar">{status.avatarUrl ? <img src={status.avatarUrl} alt="" /> : <Github size={18}/>}</div>
              <div><span>Conectado como</span><strong>@{status.account}</strong></div>
              <span className="github-connected-pill"><span/> Conectado</span>
              <button className="github-disconnect" onClick={disconnect}><Unplug size={15}/> Desconectar</button>
            </div>

            <div className="github-repo-toolbar">
              <div><h2>Repositórios</h2><p>{repositories.length} carregados · importe para editar ou baixe ZIP</p></div>
              <label className="github-search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar repositório..." /></label>
            </div>

            {loadingRepos ? (
              <div className="github-panel github-loading"><RefreshCw className="github-spin" size={20}/> Carregando repositórios...</div>
            ) : error ? (
              <div className="github-panel github-error">{error}<button onClick={loadStatus}>Tentar novamente</button></div>
            ) : filteredRepositories.length === 0 ? (
              <div className="github-panel"><h2>Nenhum repositório encontrado</h2><p>Tente outra busca ou verifique se a GitHub App tem acesso aos repositórios desejados.</p></div>
            ) : (
              <div className="github-repo-grid">
                {filteredRepositories.map((repo) => {
                  const downloadUrl = `/api/integrations/github/export?owner=${encodeURIComponent(repo.owner)}&repo=${encodeURIComponent(repo.name)}&ref=${encodeURIComponent(repo.defaultBranch)}`;
                  return (
                    <article className="github-repo-card" key={repo.id}>
                      <div className="github-repo-card-top">
                        <div className="github-repo-icon"><Github size={18}/></div>
                        <span className={repo.private ? 'github-visibility private' : 'github-visibility'}>{repo.private ? <><LockKeyhole size={12}/> Privado</> : 'Público'}</span>
                      </div>
                      <h3>{repo.name}</h3>
                      <div className="github-repo-owner">{repo.owner} / {repo.name}</div>
                      <p className="github-repo-description">{repo.description || 'Sem descrição.'}</p>
                      <div className="github-repo-meta"><span>Branch: <b>{repo.defaultBranch}</b></span><a href={repo.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${repo.fullName} no GitHub`}><ExternalLink size={14}/></a></div>
                      <button className="github-import-button" onClick={() => importRepository(repo)} disabled={Boolean(importing)}>{importing === repo.fullName ? <><LoaderCircle className="github-spin" size={16}/> Importando...</> : <><Import size={16}/> Importar para o Vynex</>}</button>
                      <a className="github-download-button" href={downloadUrl}><Download size={16}/> Baixar ZIP</a>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
