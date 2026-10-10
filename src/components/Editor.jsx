import { ArrowRight, Blocks, Check, Code2, FileCode2, Sparkles, Zap } from 'lucide-react';

export function VisualEditor({ preview, selected, onSelect }) {
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

export function CodeEditor() {
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
