import { useState } from 'react';
import {
  ArrowRight, Blocks, Braces, Check, ChevronDown, Code2, Command, Eye,
  FileCode2, Menu, Monitor, MousePointer2, PanelLeft, Play, Plus, Settings2,
  Smartphone, Sparkles, Type, Zap
} from 'lucide-react';

const components = [
  { label: 'Selecionar', icon: MousePointer2 },
  { label: 'Texto', icon: Type },
  { label: 'Botão', icon: Blocks },
  { label: 'Cartão', icon: PanelLeft },
  { label: 'Campo de texto', icon: Braces },
];

const layers = ['Página inicial', 'Cabeçalho', 'Bem-vindo', 'Botão principal'];

function ComponentSidebar({ selected, onSelect }) {
  return (
    <aside className="component-sidebar">
      <div className="sidebar-heading">COMPONENTES <Plus size={13} /></div>
      {components.map(({ label, icon: Icon }) => (
        <button key={label} onClick={() => onSelect(label)} className={'component-item' + (selected === label ? ' component-selected' : '')}>
          <Icon size={14} />{label}<span className="drag-dots">⠿</span>
        </button>
      ))}
      <div className="sidebar-heading layers-heading">CAMADAS <ChevronDown size={13} /></div>
      {layers.map((name, index) => (
        <button key={name} onClick={() => onSelect(name)} className={'layer-item' + (selected === name ? ' layer-active' : '')}>
          <span className="layer-indent" style={{ marginLeft: index === 0 ? 0 : index === 1 ? 8 : 17 }} />{name}
        </button>
      ))}
    </aside>
  );
}

function VisualCanvas({ preview, selected, onSelect }) {
  return (
    <div className="mock-app-canvas">
      <div className="mock-app-nav">
        <span className="mock-logo"><span /> STARTER</span>
        <span className="mock-nav-link">Início　 Recursos　 Sobre</span>
        <span className="mock-avatar">F</span>
      </div>
      <div className="mock-app-content">
        <div className="mock-eyebrow"><Sparkles size={12} /> SEU PRÓXIMO PROJETO</div>
        <h3>{preview ? 'Sua ideia ganhou vida.' : 'Construa algo incrível.'}</h3>
        <p>Uma experiência simples para transformar<br />suas ideias em realidade.</p>
        <button className="mock-cta" onClick={() => onSelect('Botão principal')}>Começar agora <ArrowRight size={13} /></button>
        <div className="mock-app-cards">
          <div><span className="mock-card-icon"><Zap size={15} /></span><b>Rápido</b><small>Comece em minutos</small></div>
          <div><span className="mock-card-icon purple"><Code2 size={15} /></span><b>Flexível</b><small>Você controla o código</small></div>
          <div><span className="mock-card-icon green"><Blocks size={15} /></span><b>Seu projeto</b><small>Feito do seu jeito</small></div>
        </div>
      </div>
      {!preview && <div className="selection-outline"><span>{selected}</span><i /><i /><i /><i /></div>}
    </div>
  );
}

function CodeEditor() {
  return (
    <div className="code-editor">
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
    </div>
  );
}

function PropertiesSidebar({ selected }) {
  return (
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
  );
}

export default function WorkspacePreview() {
  const [tab, setTab] = useState('Visual');
  const [selected, setSelected] = useState('Bem-vindo');
  const [preview, setPreview] = useState(false);
  const [appTitle] = useState('Meu primeiro app');

  return (
    <div className="workspace-window">
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
        <ComponentSidebar selected={selected} onSelect={setSelected} />
        <main className={'canvas-area' + (preview ? ' canvas-preview' : '')}>
          <div className="canvas-meta"><span><Monitor size={13} /> Página inicial</span><span>100%</span></div>
          {tab === 'Visual' ? <VisualCanvas preview={preview} selected={selected} onSelect={setSelected} /> : <CodeEditor />}
          <div className="canvas-bottom"><span><span className="status-dot" /> Tudo salvo</span><span>React · TypeScript</span></div>
        </main>
        <PropertiesSidebar selected={selected} />
      </div>
      <div className="window-footer"><span><span className="footer-pulse" /> Projeto de demonstração</span><span><Command size={12} /> K <span className="footer-divider" /> Ajuda</span></div>
    </div>
  );
}
