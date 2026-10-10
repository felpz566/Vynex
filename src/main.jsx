import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, Blocks, Check, ChevronDown,
  Code2, Command, Download, Eye, FileCode2, Figma, Github, Globe2,
  Layers3, Menu, Monitor, MousePointer2, Play, Plus, Sparkles, WandSparkles,
  X, Zap, Smartphone, Braces, PanelLeft, Settings2, Search
} from 'lucide-react';
import './styles.css';

const features = [
  { icon: Blocks, title: 'Monte visualmente', description: 'Arraste componentes para a tela e ajuste cada detalhe sem brigar com configurações.' },
  { icon: Code2, title: 'Código de verdade', description: 'Edite a lógica em um editor completo, com autocomplete e realce de sintaxe desde o plano grátis.' },
  { icon: Download, title: 'Pronto para compilar', description: 'Prepare seu projeto para Windows e, nos planos compatíveis, Android.' },
];

function Logo({ small = false }) {
  return <a className={'brand' + (small ? ' brand-small' : '')} href="#inicio" aria-label="Vynex início">
    <span className="brand-mark"><Layers3 size={small ? 17 : 20} strokeWidth={2.4} /></span>
    <span>vynex<span className="brand-period">.</span></span>
  </a>;
}

function WorkspacePreview() {
  const [tab, setTab] = useState('Visual');
  const [selected, setSelected] = useState('Bem-vindo');
  const [preview, setPreview] = useState(false);
  const [appTitle, setAppTitle] = useState('Meu primeiro app');
  return <div className="workspace-window">
    <div className="window-topbar">
      <div className="window-dots"><i /><i /><i /></div>
      <div className="window-project"><span className="tiny-project-icon"><Blocks size={13} /></span>{appTitle}<ChevronDown size={13} /></div>
      <div className="window-status"><span className="status-dot" /> Salvo</div>
      <button className="mini-icon" aria-label="Configurações"><Settings2 size={15} /></button>
    </div>
    <div className="workspace-toolbar">
      <div className="view-tabs">
        <button className={tab === 'Visual' ? 'view-tab active' : 'view-tab'} onClick={() => setTab('Visual')}><MousePointer2 size={14} /> Visual</button>
        <button className={tab === 'Código' ? 'view-tab active' : 'view-tab'} onClick={() => setTab('Código')}><Code2 size={14} /> Código</button>
      </div>
      <div className="toolbar-actions">
        <button className="toolbar-quiet" onClick={() => setPreview(!preview)}><Eye size={14} /> {preview ? 'Editar' : 'Prévia'}</button>
        <button className="toolbar-build" onClick={() => setPreview(true)}><Play size={13} fill="currentColor" /> Testar</button>
      </div>
    </div>
    <div className="workspace-body">
      <aside className="component-sidebar">
        <div className="sidebar-heading">COMPONENTES <Plus size={13} /></div>
        {[['MousePointer2','Selecionar'],['Type','Texto'],['Square','Botão'],['PanelsTopLeft','Cartão'],['TextCursorInput','Campo de texto']].map(([name,label], i) => {
          const Icon = [MousePointer2, Code2, Blocks, PanelLeft, Braces][i];
          return <button key={label} onClick={() => setSelected(label)} className={'component-item' + (selected === label ? ' component-selected' : '')}><Icon size={14} />{label}<span className="drag-dots">⠿</span></button>;
        })}
        <div className="sidebar-heading layers-heading">CAMADAS <ChevronDown size={13} /></div>
        {['Página inicial','Cabeçalho','Bem-vindo','Botão principal'].map((name, i) => <button key={name} onClick={() => setSelected(name)} className={'layer-item' + (selected === name ? ' layer-active' : '')}><span className="layer-indent" style={{marginLeft:i===0?0:i===1?8:17}} />{name}</button>)}
      </aside>
      <main className={'canvas-area' + (preview ? ' canvas-preview' : '')}>
        <div className="canvas-meta"><span><Monitor size={13} /> Página inicial</span><span>100%</span></div>
        {tab === 'Visual' ? <div className="mock-app-canvas">
          <div className="mock-app-nav"><span className="mock-logo"><span /> STARTER</span><span className="mock-nav-link">Início　 Recursos　 Sobre</span><span className="mock-avatar">F</span></div>
          <div className="mock-app-content">
            <div className="mock-eyebrow"><Sparkles size={12} /> SEU PRÓXIMO PROJETO</div>
            <h3>{preview ? 'Sua ideia ganhou vida.' : 'Construa algo incrível.'}</h3>
            <p>Uma experiência simples para transformar<br />suas ideias em realidade.</p>
            <button className="mock-cta" onClick={() => setSelected('Botão principal')}>Começar agora <ArrowRight size={13} /></button>
            <div className="mock-app-cards"><div><span className="mock-card-icon"><Zap size={15} /></span><b>Rápido</b><small>Comece em minutos</small></div><div><span className="mock-card-icon purple"><Code2 size={15} /></span><b>Flexível</b><small>Você controla o código</small></div><div><span className="mock-card-icon green"><Blocks size={15} /></span><b>Seu projeto</b><small>Feito do seu jeito</small></div></div>
          </div>
          {!preview && <div className="selection-outline"><span>{selected}</span><i /><i /><i /><i /></div>}
        </div> : <div className="code-editor">
          <div className="code-file"><FileCode2 size={14} /> App.tsx <span>●</span></div>
          <div className="code-lines">
            <div><em>1</em><span><b>import</b> {'{'} Button {'}'} <b>from</b> <strong>'@vynex/ui'</strong>;</span></div>
            <div><em>2</em></div>
            <div><em>3</em><span><b>export default function</b> <i>App</i>() {'{'}</span></div>
            <div><em>4</em><span>　<b>return</b> (</span></div>
            <div><em>5</em><span>　　&lt;<i>main</i> <u>className</u>=<strong>"home"</strong>&gt;</span></div>
            <div><em>6</em><span>　　　&lt;<i>h1</i>&gt;Olá, mundo!&lt;/<i>h1</i>&gt;</span></div>
            <div className="suggestion-line"><em>7</em><span>　　　&lt;<i>Button</i> <u>onClick</u>={'{'}handleClick{'}'}&gt;</span></div>
            <div><em>8</em><span>　　　　Começar agora</span></div>
            <div><em>9</em><span>　　　&lt;/<i>Button</i>&gt;</span></div>
            <div><em>10</em><span>　　&lt;/<i>main</i>&gt;</span></div>
            <div><em>11</em><span>　);</span></div>
            <div><em>12</em><span>{'}'}</span></div>
          </div>
          <div className="autocomplete"><span className="auto-icon"><Code2 size={13}/></span><span><b>handleClick</b><small>function · App.tsx</small></span><kbd>↵</kbd></div>
          <div className="editor-bottom"><span>Ln 7, Col 19</span><span>TypeScript JSX</span><span>Autocomplete <Check size={11}/></span></div>
        </div>}
        <div className="canvas-bottom"><span><span className="status-dot" /> Tudo salvo</span><span>React · TypeScript</span></div>
      </main>
      <aside className="properties-sidebar">
        <div className="properties-title">Propriedades <Settings2 size={13} /></div>
        <div className="property-label">ELEMENTO</div><div className="selected-element"><Blocks size={14} />{selected}<ChevronDown size={13}/></div>
        <div className="property-label">APARÊNCIA</div>
        <label className="property-control">Largura <span>Auto <ChevronDown size={11}/></span></label>
        <label className="property-control">Altura <span>Auto <ChevronDown size={11}/></span></label>
        <label className="property-control">Opacidade <span>100%</span></label><div className="fake-slider"><span /></div>
        <div className="property-label">ESTILO</div>
        <label className="property-control">Cor do texto <span><i className="color-swatch" /> #F8FAFC</span></label>
        <label className="property-control">Alinhamento <span className="align-buttons">☰　☷</span></label>
        <div className="property-label">EVENTOS</div><div className="event-box"><Zap size={13}/> Ao clicar <ArrowRight size={12}/></div>
        <div className="property-hint">Personalize seu elemento no painel de propriedades.</div>
      </aside>
    </div>
    <div className="window-footer"><span><span className="footer-pulse" /> Projeto de demonstração</span><span><Command size={12} /> K <span className="footer-divider" /> Ajuda</span></div>
  </div>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [created, setCreated] = useState(false);
  const [billing, setBilling] = useState('mensal');
  const [toast, setToast] = useState('');
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  const startProject = () => { setModalOpen(true); setMenuOpen(false); };
  const createProject = (event) => { event.preventDefault(); if (!projectName.trim()) return; setCreated(true); setModalOpen(false); notify('Projeto criado! O editor estará disponível nesta etapa do produto.'); };
  return <div className="site-shell" id="inicio">
    <header className="site-header">
      <div className="header-inner"><Logo />
        <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'}>
          <a href="#recursos" onClick={() => setMenuOpen(false)}>Recursos</a><a href="#como-funciona" onClick={() => setMenuOpen(false)}>Como funciona</a><a href="#planos" onClick={() => setMenuOpen(false)}>Planos</a>
        </nav>
        <div className="header-actions"><button className="login-link" onClick={() => notify('O acesso à conta será ativado em breve.')}>Entrar</button><button className="header-cta" onClick={startProject}>Começar grátis <ArrowUpRight size={15}/></button></div>
        <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button>
      </div>
    </header>
    <main>
      <section className="hero-section">
        <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
        <div className="hero-content">
          <div className="announcement"><span className="announcement-dot" /> UMA NOVA FORMA DE CRIAR SOFTWARE <ArrowRight size={13}/></div>
          <h1>Da sua ideia<br/>ao <span className="gradient-text">seu aplicativo.</span></h1>
          <p className="hero-subtitle">Desenhe interfaces, escreva código e transforme seus projetos em aplicativos. Tudo em um só lugar, do seu jeito.</p>
          <div className="hero-buttons"><button className="primary-button" onClick={startProject}>Comece de graça <ArrowRight size={16}/></button><a className="secondary-button" href="#como-funciona"><span className="play-circle"><Play size={11} fill="currentColor"/></span> Conheça a plataforma</a></div>
          <div className="hero-proof"><div className="proof-avatars"><span>V</span><span>⌘</span><span>{'{ }'}</span></div><span>Para quem está começando e para quem já programa.</span></div>
        </div>
        <div className="hero-product"><div className="product-orbit orbit-a" /><div className="product-orbit orbit-b" /><WorkspacePreview /><div className="floating-chip chip-autocomplete"><span className="chip-icon"><Code2 size={15}/></span><span><b>Autocomplete</b><small>Incluído no plano grátis</small></span><Check size={14} className="chip-check"/></div><div className="floating-chip chip-build"><span className="build-icon"><Download size={16}/></span><span><b>Pronto para exportar</b><small>Seu app, sua liberdade</small></span></div></div>
        <div className="hero-bottom"><span>UMA PLATAFORMA. MUITAS POSSIBILIDADES.</span><div><span><Monitor size={14}/> Windows</span><span><Smartphone size={14}/> Android</span><span><Braces size={14}/> Código editável</span></div></div>
      </section>
      <section className="feature-section section-wrap" id="recursos">
        <div className="section-kicker"><span /> CRIADO PARA O SEU FLUXO</div><div className="section-heading-row"><h2>Visual quando quiser.<br/><span className="muted-heading">Código quando precisar.</span></h2><p>Você não precisa escolher entre facilidade e controle. Na Vynex, os dois trabalham juntos.</p></div>
        <div className="feature-grid">{features.map(({icon:Icon,title,description},i)=><article className="feature-card" key={title}><div className={'feature-icon icon-'+i}><Icon size={20}/></div><span className="feature-number">0{i+1}</span><h3>{title}</h3><p>{description}</p><a href="#como-funciona">Explorar recurso <ArrowUpRight size={14}/></a></article>)}</div>
      </section>
      <section className="workflow-section" id="como-funciona"><div className="section-wrap workflow-wrap"><div className="workflow-copy"><div className="section-kicker"><span /> SIMPLES ASSIM</div><h2>Menos configuração.<br/><span className="gradient-text">Mais criação.</span></h2><p>Comece pela interface, ajuste os detalhes e programe o comportamento. Você tem liberdade para evoluir do visual ao código sem recomeçar do zero.</p><div className="workflow-steps"><div><span>01</span><div><b>Crie sua interface</b><small>Componentes visuais para montar suas telas.</small></div><Check size={15}/></div><div><span>02</span><div><b>Adicione sua lógica</b><small>Editor com autocomplete, estrutura e dicas.</small></div><Check size={15}/></div><div><span>03</span><div><b>Prepare seu aplicativo</b><small>Configure o projeto e inicie o processo de build.</small></div><ArrowRight size={15}/></div></div><button className="primary-button" onClick={startProject}>Quero experimentar <ArrowRight size={15}/></button></div><div className="workflow-visual"><div className="workflow-backdrop" /><div className="workflow-card"><div className="workflow-card-top"><span><span className="status-dot"/> MEU PROJETO</span><span>v0.1</span></div><div className="workflow-app-icon"><Blocks size={27}/></div><h3>Meu aplicativo</h3><p>Seu próximo projeto começa aqui.</p><div className="workflow-progress"><span/></div><div className="workflow-progress-label"><span>Preparando projeto</span><b>Pronto para começar</b></div><div className="workflow-platforms"><span><Monitor size={15}/> Windows</span><span><Smartphone size={15}/> Android</span></div></div><div className="workflow-float float-code"><Code2 size={15}/><span>App.tsx</span><span className="float-file-dot"/></div><div className="workflow-float float-check"><span className="check-circle"><Check size={13}/></span><span><b>Seu projeto</b><small>Organizado e editável</small></span></div></div></div></section>
      <section className="pricing-section section-wrap" id="planos"><div className="pricing-heading"><div className="section-kicker"><span /> PLANOS PARA CADA FASE</div><h2>Comece grátis.<br/><span className="muted-heading">Cresça no seu ritmo.</span></h2><p>O essencial para começar sem cartão de crédito. Mais recursos quando você precisar.</p><div className="billing-toggle"><button className={billing==='mensal'?'billing-active':''} onClick={()=>setBilling('mensal')}>Mensal</button><button className={billing==='anual'?'billing-active':''} onClick={()=>setBilling('anual')}>Anual <span>Economize</span></button></div></div>
        <div className="pricing-grid">
          <article className="price-card"><div className="plan-label">PARA COMEÇAR</div><h3>Free</h3><p>Experimente suas ideias e conheça o fluxo de criação.</p><div className="price-value"><strong>R$ 0</strong><span>/ sempre</span></div><button className="plan-button plan-button-light" onClick={startProject}>Começar grátis <ArrowRight size={14}/></button><div className="plan-divider"/><span className="includes-label">INCLUI</span>{['Editor visual básico','Editor de código + autocomplete','Projetos de demonstração','Prévia da interface'].map(t=><div className="plan-feature" key={t}><Check size={14}/>{t}</div>)}</article>
          <article className="price-card price-featured"><div className="popular-pill"><Sparkles size={12}/> MAIS LIBERDADE</div><div className="plan-label">PARA CRIADORES</div><h3>Pro</h3><p>Para quem quer construir projetos mais completos.</p><div className="price-value"><strong>{billing==='mensal'?'R$ 29,90':'R$ 23,90'}</strong><span>/ mês{billing==='anual'?' · cobrado anualmente':''}</span></div><button className="plan-button plan-button-primary" onClick={()=>notify('Os pagamentos serão disponibilizados quando os builds estiverem prontos.')}>Conhecer o Pro <ArrowRight size={14}/></button><div className="plan-divider"/><span className="includes-label">TUDO DO FREE, MAIS</span>{['Projetos privados','Builds para Windows (.exe)','Mais builds e recursos','Assistência de IA opcional'].map(t=><div className="plan-feature" key={t}><Check size={14}/>{t}</div>)}</article>
          <article className="price-card"><div className="plan-label">PARA PUBLICAR</div><h3>Creator</h3><p>Mais formatos e ferramentas para tirar projetos do papel.</p><div className="price-value"><strong>{billing==='mensal'?'R$ 59,90':'R$ 47,90'}</strong><span>/ mês{billing==='anual'?' · cobrado anualmente':''}</span></div><button className="plan-button plan-button-light" onClick={()=>notify('O plano Creator será disponibilizado em uma próxima etapa.')}>Explorar Creator <ArrowRight size={14}/></button><div className="plan-divider"/><span className="includes-label">TUDO DO PRO, MAIS</span>{['Exportação Android (APK/AAB)','Mais capacidade de build','Configurações de publicação','Recursos avançados'].map(t=><div className="plan-feature" key={t}><Check size={14}/>{t}</div>)}</article>
        </div><p className="pricing-note">Preços ilustrativos para planejamento. Assinaturas e exportações ainda não estão ativas.</p>
      </section>
      <section className="final-cta"><div className="cta-glow"/><div className="section-kicker"><span /> SUA IDEIA MERECE EXISTIR</div><h2>O próximo app pode<br/>começar <span className="gradient-text">aqui.</span></h2><p>Uma ideia, um projeto e as ferramentas para tirar do papel.</p><button className="primary-button" onClick={startProject}>Criar meu primeiro projeto <ArrowRight size={16}/></button><small>Grátis para começar · Sem cartão de crédito</small></section>
    </main>
    <footer className="site-footer"><div className="footer-top"><Logo/><span>Uma ideia de cada vez. Um app de cada vez.</span><div className="footer-links"><a href="#recursos">Recursos</a><a href="#planos">Planos</a><a href="https://github.com/felpz566/Vynex" target="_blank" rel="noreferrer"><Github size={14}/> GitHub</a></div></div><div className="footer-bottom"><span>© 2026 Vynex. Feito para quem cria.</span><span><span className="status-dot"/> Em desenvolvimento</span></div></footer>
    {modalOpen && <div className="modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setModalOpen(false)}}><form className="project-modal" onSubmit={createProject}><button type="button" className="modal-close" aria-label="Fechar" onClick={()=>setModalOpen(false)}><X size={18}/></button><div className="modal-icon"><Plus size={22}/></div><div className="section-kicker"><span/> VAMOS COMEÇAR</div><h2>Crie seu projeto</h2><p>Dê um nome à sua ideia. Você poderá mudar depois.</p><label htmlFor="project-name">Nome do projeto</label><input autoFocus id="project-name" value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Ex.: Meu aplicativo" maxLength={48} required/><div className="modal-choice-label">COMO QUER COMEÇAR?</div><button type="button" className="start-option selected-option" onClick={()=>notify('O editor visual fará parte do próximo passo.')}><span className="option-icon"><Blocks size={17}/></span><span><b>Editor visual</b><small>Comece montando a interface</small></span><span className="option-radio"><Check size={12}/></span></button><button type="button" className="start-option" onClick={()=>notify('O editor de código fará parte do próximo passo.')}><span className="option-icon option-code"><Code2 size={17}/></span><span><b>Começar pelo código</b><small>Para quem prefere escrever código</small></span><span className="option-radio empty-radio"/></button><button type="submit" className="primary-button modal-submit">Criar projeto <ArrowRight size={15}/></button><small className="modal-disclaimer">Protótipo visual · Nenhum dado é enviado para um servidor.</small></form></div>}
    {created && <div className="created-banner"><span className="check-circle"><Check size={14}/></span><span><b>{projectName}</b><small>Projeto de demonstração criado nesta sessão.</small></span><button onClick={()=>setCreated(false)} aria-label="Fechar"><X size={15}/></button></div>}
    {toast && <div className="toast-message"><Check size={15}/>{toast}</div>}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
