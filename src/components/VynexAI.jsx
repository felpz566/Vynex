'use client';
import { useEffect, useMemo, useState } from 'react';
import { Bot, Check, CheckCircle2, ChevronDown, ChevronUp, CircleAlert, Clock3, Code2, Eye, LoaderCircle, Palette, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import './VynexAI.css';

const STAGE_LABELS = {
  code: ['Analisando solicitação', 'Planejando alterações', 'Programando', 'Verificando código', 'Corrigindo e revisando', 'Aguardando aprovação'],
  design: ['Analisando solicitação', 'Planejando design', 'Criando prévia estruturada', 'Revisando design e JSON', 'Aguardando aprovação'],
};
function decodeBase64(value) { try { return decodeURIComponent(escape(atob(value || ''))); } catch { return ''; } }
function textFiles(files) {
  return (files || []).filter((file) => /\.(?:js|jsx|ts|tsx|mjs|cjs|json|css|html|md|txt|svg|yml|yaml|toml|xml|lua|py)$/i.test(String(file.path || '')))
    .map((file) => ({ path: file.path, content: typeof file.content === 'string' ? file.content : decodeBase64(file.contentBase64) }));
}
function DesignPreview({ content }) {
  const design = useMemo(() => { try { return JSON.parse(content); } catch { return null; } }, [content]);
  if (!design || !Array.isArray(design.elements)) return <p className="vynex-ai-muted">A prévia não pôde ser interpretada. O JSON será revisado antes de aplicar.</p>;
  return <div className="vynex-ai-preview" style={{ background: /^#[0-9a-f]{6}$/i.test(design.background || '') ? design.background : '#11131c' }}>
    {design.elements.filter((item) => item?.visible !== false).slice(0, 30).map((item, index) => {
      const common = { color: /^#[0-9a-f]{6}$/i.test(item.color || '') ? item.color : '#f8fafc', fontSize: Math.max(10, Math.min(48, Number(item.fontSize) || 16)), textAlign: ['left', 'center', 'right'].includes(item.align) ? item.align : 'center', width: Math.max(10, Math.min(100, Number(item.width) || 100)) + '%', margin: '8px auto', overflowWrap: 'anywhere' };
      if (item.type === 'box') return <div key={item.id || index} style={{ ...common, height: 35, borderRadius: 8, background: item.background || '#3730a3' }} />;
      if (item.type === 'image') return <div key={item.id || index} style={{ ...common, border: '1px dashed #aaa8', padding: 12, borderRadius: 8 }}>Imagem: {item.text || 'sem URL'}</div>;
      if (item.type === 'button') return <div key={item.id || index} style={{ ...common, background: item.background || '#8b5cf6', color: item.color || '#fff', padding: '10px 12px', borderRadius: 8, textAlign: 'center' }}>{item.text || 'Botão'}</div>;
      if (item.type === 'toggle' || item.type === 'checkbox') return <div key={item.id || index} style={{ ...common, textAlign: 'left' }}>☐ {item.text || item.type}</div>;
      if (item.type === 'tabs') return <div key={item.id || index} style={{ ...common, display: 'flex', flexWrap: 'wrap', gap: 6 }}>{String(item.text || 'Início, Sobre').split(',').map((tab) => <span key={tab} style={{ background: item.background || '#292b36', padding: 6, borderRadius: 5 }}>{tab.trim()}</span>)}</div>;
      return <div key={item.id || index} style={{ ...common, fontWeight: item.type === 'heading' ? 750 : 400, lineHeight: 1.45 }}>{item.text || (item.type === 'heading' ? 'Título' : 'Texto')}</div>;
    })}
  </div>;
}
export default function VynexAI({ projectName, files, mode = 'code', onApply }) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [stageIndex, setStageIndex] = useState(-1);
  const [usage, setUsage] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [applying, setApplying] = useState(false);
  const stages = STAGE_LABELS[mode] || STAGE_LABELS.code;
  const refreshUsage = async () => {
    try {
      const response = await fetch('/api/ai', { cache: 'no-store' });
      const data = await response.json();
      if (response.ok) setUsage(data.usage);
      else if (response.status !== 401) setError(data.error || 'Não foi possível consultar os créditos.');
    } catch {}
  };
  useEffect(() => { refreshUsage(); }, []);
  const requestProposal = async (event) => {
    event.preventDefault();
    if (!prompt.trim() || busy) return;
    setBusy(true); setStageIndex(0); setError(''); setNotice(''); setProposal(null);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ mode, prompt: prompt.trim(), projectName, files: textFiles(files) }),
      });
      if (!response.body) throw new Error('O navegador não conseguiu abrir o fluxo de progresso da IA.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let resultEvent = null;
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        for (const block of blocks) {
          const line = block.split('\n').find((entry) => entry.startsWith('data: '));
          if (!line) continue;
          const event = JSON.parse(line.slice(6));
          if (event.type === 'stage') setStageIndex(Math.max(0, Math.min(stages.length - 1, Number(event.index) || 0)));
          if (event.type === 'result') resultEvent = event;
        }
        if (done) break;
      }
      if (!resultEvent) throw new Error('A IA encerrou a resposta sem enviar o resultado final.');
      const data = resultEvent.data || {};
      if (resultEvent.status < 200 || resultEvent.status >= 300) {
        if (data.usage) setUsage(data.usage);
        throw new Error(data.error || 'A IA não conseguiu preparar uma proposta.');
      }
      setProposal(data.proposal); setUsage(data.usage); setStageIndex(stages.length - 1);
      setNotice('A proposta foi revisada. Nada foi alterado no projeto ainda.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao conversar com a IA.');
      setStageIndex(-1); refreshUsage();
    } finally { setBusy(false); }
  };
  const decide = async (action) => {
    if (!proposal || applying) return;
    setApplying(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, proposalId: proposal.id }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível processar a proposta.');
      if (action === 'approve') {
        await onApply?.(data.proposal.changes, data.proposal);
        setNotice('Alterações aplicadas ao rascunho local. Salve ou envie o projeto para persistir em outro dispositivo.');
      } else setNotice('Proposta recusada. Os arquivos do projeto não foram alterados.');
      setProposal(null); setStageIndex(-1); refreshUsage();
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível decidir a proposta.'); }
    finally { setApplying(false); }
  };
  const previewContent = proposal?.mode === 'design' ? proposal.changes?.find((change) => change.path === 'vynex-design.json')?.content : null;
  const currentUsage = usage?.admin ? 'Ilimitado' : usage ? String(usage.remaining) + '/' + String(usage.limit) : '…';
  return <section className="vynex-ai-panel">
    <button type="button" className="vynex-ai-heading" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
      <span className="vynex-ai-icon"><Sparkles size={18}/></span>
      <span className="vynex-ai-heading-copy"><strong>Vynex AI</strong><small>{mode === 'design' ? 'Assistente de design visual' : 'Assistente de programação'}</small></span>
      <span className="vynex-ai-credits"><Bot size={13}/> {currentUsage} créditos</span>{expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
    </button>
    {expanded && <div className="vynex-ai-body">
      <div className="vynex-ai-explainer"><ShieldCheck size={15}/><span>A IA prepara e revisa uma proposta. <b>Os arquivos só mudam depois da sua aprovação.</b></span></div>
      <form onSubmit={requestProposal} className="vynex-ai-form">
        <label htmlFor={'vynex-ai-prompt-' + mode}>O que você quer {mode === 'design' ? 'desenhar' : 'programar'}?</label>
        <textarea id={'vynex-ai-prompt-' + mode} value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={3} maxLength={12000} placeholder={mode === 'design' ? 'Ex.: crie uma tela de login moderna, com formulário central, logo e botão roxo…' : 'Ex.: adicione validação de formulário, revise os erros e preserve o comportamento atual…'} disabled={busy}/>
        <div className="vynex-ai-form-bottom"><span>{mode === 'design' ? <Palette size={13}/> : <Code2 size={13}/>} {projectName || 'Nenhum projeto selecionado'}</span><button type="submit" disabled={busy || !prompt.trim() || !projectName}>{busy ? <><LoaderCircle className="vynex-ai-spin" size={15}/> Trabalhando…</> : <><Send size={15}/> Preparar proposta</>}</button></div>
      </form>
      {busy && <div className="vynex-ai-progress" aria-live="polite">
        <div className="vynex-ai-progress-title"><LoaderCircle className="vynex-ai-spin" size={15}/> {stages[stageIndex] || 'Preparando solicitação'}</div>
        <p>A IA está trabalhando no servidor e fará uma segunda revisão antes de mostrar qualquer alteração.</p>
        <div className="vynex-ai-stage-list">{stages.map((stage, index) => <div className={'vynex-ai-stage' + (index < stageIndex ? ' done' : index === stageIndex ? ' active' : '')} key={stage}>{index < stageIndex ? <CheckCircle2 size={14}/> : index === stageIndex ? <LoaderCircle className="vynex-ai-spin" size={14}/> : <span className="vynex-ai-stage-dot"/>}<span>{stage}</span></div>)}</div>
      </div>}
      {error && <div className="vynex-ai-error"><CircleAlert size={15}/><span>{error}</span></div>}
      {notice && <div className="vynex-ai-notice"><CheckCircle2 size={15}/><span>{notice}</span></div>}
      {proposal && <div className="vynex-ai-proposal">
        <div className="vynex-ai-proposal-title"><span><CheckCircle2 size={17}/> Proposta pronta para revisão</span><span className="vynex-ai-expiry"><Clock3 size={12}/> 30 min</span></div>
        <h3>{proposal.summary}</h3>
        {proposal.reviewNotes && <p className="vynex-ai-review-notes">{proposal.reviewNotes}</p>}
        {previewContent && <><div className="vynex-ai-subheading"><Eye size={14}/> Prévia do design gerado</div><DesignPreview content={previewContent}/><p className="vynex-ai-muted">Prévia estrutural gerada a partir do JSON. Abra o Editor Visual para conferir a renderização real antes de publicar.</p></>}
        <div className="vynex-ai-subheading">Arquivos propostos ({proposal.changes?.length || 0})</div>
        <div className="vynex-ai-changes">{proposal.changes?.map((change) => <div key={change.path}><Code2 size={14}/><span>{change.path}</span><small>{change.content.length.toLocaleString('pt-BR')} caracteres</small></div>)}</div>
        {proposal.checks?.length > 0 && <details className="vynex-ai-checks"><summary>Verificações da revisão ({proposal.checks.length})</summary>{proposal.checks.map((check, index) => <div key={check.label + '-' + index} className={'vynex-ai-check ' + (check.status || 'warning')}><span>{check.status === 'passed' ? <CheckCircle2 size={14}/> : <CircleAlert size={14}/>}</span><div><b>{check.label}</b><p>{check.detail}</p></div></div>)}</details>}
        <div className="vynex-ai-approval-note">Revise a proposta. Ao aprovar, os arquivos correspondentes do rascunho serão substituídos ou novos arquivos serão adicionados.</div>
        <div className="vynex-ai-decision-actions"><button type="button" className="vynex-ai-reject" onClick={() => decide('reject')} disabled={applying}><X size={15}/> Recusar</button><button type="button" className="vynex-ai-approve" onClick={() => decide('approve')} disabled={applying}>{applying ? <LoaderCircle className="vynex-ai-spin" size={15}/> : <Check size={15}/>} Aprovar e aplicar</button></div>
      </div>}
    </div>}
  </section>;
}
