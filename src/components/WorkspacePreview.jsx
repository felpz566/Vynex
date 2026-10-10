import { useState } from 'react';
import {
  Blocks, Check, ChevronDown, Code2, Command, Eye, MousePointer2,
  Monitor, Play, Settings2
} from 'lucide-react';
import { ComponentSidebar, PropertiesSidebar } from './Sidebar.jsx';
import { CodeEditor, VisualEditor } from './Editor.jsx';

export default function WorkspacePreview() {
  const [tab, setTab] = useState('Visual');
  const [selected, setSelected] = useState('Bem-vindo');
  const [preview, setPreview] = useState(false);
  const appTitle = 'Meu primeiro app';

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
          {tab === 'Visual'
            ? <VisualEditor preview={preview} selected={selected} onSelect={setSelected} />
            : <CodeEditor />}
          <div className="canvas-bottom"><span><span className="status-dot" /> Tudo salvo</span><span>React · TypeScript</span></div>
        </main>
        <PropertiesSidebar selected={selected} />
      </div>

      <div className="window-footer">
        <span><span className="footer-pulse" /> Projeto de demonstração</span>
        <span><Command size={12} /> K <span className="footer-divider" /> Ajuda</span>
      </div>
    </div>
  );
}
