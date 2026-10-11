'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Eye, Layers3, Monitor, Plus, Save, Smartphone, Trash2, Type, Square, Image as ImageIcon, MousePointer2, Move, ChevronUp, ChevronDown } from 'lucide-react';
import './design.css';

const STORAGE_KEY = 'vynex.projects.v1';
const DESIGN_PATH = 'vynex-design.json';

const STARTER = [
  { id: 'hero-title', type: 'heading', text: 'Crie algo incrível', x: 0, y: 0, width: 100, color: '#f8fafc', fontSize: 38, align: 'center' },
  { id: 'hero-copy', type: 'text', text: 'Transforme suas ideias em um aplicativo de verdade.', x: 0, y: 0, width: 100, color: '#b8c0d4', fontSize: 16, align: 'center' },
  { id: 'hero-button', type: 'button', text: 'Começar agora', x: 0, y: 0, width: 100, color: '#ffffff', background: '#8b5cf6', fontSize: 14, align: 'center' },
];

function decodeBase64(value) {
  try { return decodeURIComponent(escape(atob(value || ''))); } catch { return ''; }
}
function encodeBase64(value) {
  return btoa(unescape(encodeURIComponent(value)));
}
function makeId() { return `element-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

export default function VisualDesignPage() {
  const [projects, setProjects] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [elements, setElements] = useState(STARTER);
  const [selectedId, setSelectedId] = useState(STARTER[0].id);
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [device, setDevice] = useState('desktop');
  const [notice, setNotice] = useState('');
  const [background, setBackground] = useState('#11131c');
  const [controlStates, setControlStates] = useState({});
  const dragRef = useRef(null);
  const canvasRef = useRef(null);
  const selected = elements.find((item) => item.id === selectedId) || null;
  const activeProject = projects.find((item) => item.id === activeId) || null;

  useEffect(() => {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch {}
    setProjects(Array.isArray(stored) ? stored : []);
    const id = new URLSearchParams(window.location.search).get('project');
    const found = (Array.isArray(stored) ? stored : []).find((item) => item.id === id) || (Array.isArray(stored) ? stored[0] : null);
    if (found) {
      setActiveId(found.id);
      const designFile = found.files?.find((file) => file.path === DESIGN_PATH);
      if (designFile) {
        try {
          const design = JSON.parse(decodeBase64(designFile.contentBase64));
          if (Array.isArray(design.elements) && design.elements.length) setElements(design.elements);
          if (typeof design.background === 'string') setBackground(design.background);
        } catch {}
      }
    }
    setProjectLoaded(true);
  }, []);

  const persistDesign = (nextElements = elements, nextBackground = background) => {
    if (!activeId) { setNotice('Crie um projeto no workspace antes de salvar o design.'); return; }
    const payload = { version: 1, background: nextBackground, elements: nextElements };
    const encoded = encodeBase64(JSON.stringify(payload, null, 2));
    const size = new TextEncoder().encode(JSON.stringify(payload, null, 2)).length;
    const nextProjects = projects.map((project) => {
      if (project.id !== activeId) return project;
      const files = [...(project.files || [])];
      const idx = files.findIndex((file) => file.path === DESIGN_PATH);
      const file = { path: DESIGN_PATH, contentBase64: encoded, size };
      if (idx >= 0) files[idx] = file; else files.push(file);
      return { ...project, files, updatedAt: Date.now() };
    });
    setProjects(nextProjects);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProjects));
    setNotice('Design salvo no projeto. O Vynex gera a interface no momento da compilação; você não precisa criar index.html.');
  };

  const addElement = (type) => {
    const item = {
      id: makeId(), type,
      text: type === 'heading' ? 'Novo título' : type === 'text' ? 'Escreva seu texto aqui.' : type === 'button' ? 'Clique aqui' : type === 'image' ? 'https://placehold.co/640x360' : type === 'toggle' ? 'Ativar notificações' : type === 'checkbox' ? 'Aceito os termos' : type === 'tabs' ? 'Início, Sobre, Contato' : '',
      x: 0, y: 0, width: 100, color: type === 'button' ? '#ffffff' : '#f8fafc',
      background: ['button', 'toggle', 'checkbox', 'tabs'].includes(type) ? '#8b5cf6' : 'transparent',
      fontSize: type === 'heading' ? 28 : type === 'button' ? 14 : 16,
      align: 'center',
    };
    const next = [...elements, item];
    setElements(next); setSelectedId(item.id); setNotice('');
  };

  const updateSelected = (key, value) => setElements((current) => current.map((item) => item.id === selectedId ? { ...item, [key]: value } : item));
  const moveSelected = (direction) => {
    const index = elements.findIndex((item) => item.id === selectedId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= elements.length) return;
    const next = [...elements];
    [next[index], next[target]] = [next[target], next[index]];
    setElements(next);
  };
  const removeSelected = () => {
    const next = elements.filter((item) => item.id !== selectedId);
    setElements(next);
    setSelectedId(next[0]?.id || '');
  };

  const beginCanvasMove = (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(id);
    dragRef.current = { mode: 'move', id, startX: event.clientX, startY: event.clientY, startLeft: Number(elements.find((item) => item.id === id)?.x) || 0, startTop: Number(elements.find((item) => item.id === id)?.y) || 0 };
  };

  const beginCanvasResize = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(item.id);
    dragRef.current = { mode: 'resize', id: item.id, startX: event.clientX, startWidth: Number(item.width) || 100 };
  };

  useEffect(() => {
    const onPointerMove = (event) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (drag.mode === 'resize') {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect?.width) return;
        const delta = ((event.clientX - drag.startX) / rect.width) * 100;
        const width = Math.max(10, Math.min(100, Math.round(drag.startWidth + delta)));
        setElements((current) => current.map((item) => item.id === drag.id ? { ...item, width } : item));
        return;
      }
      const deltaX = event.clientX - drag.startX;
      const deltaY = event.clientY - drag.startY;
      setElements((current) => current.map((item) => item.id === drag.id
        ? { ...item, x: Math.max(-2000, Math.min(2000, Math.round(drag.startLeft + deltaX))), y: Math.max(-2000, Math.min(2000, Math.round(drag.startTop + deltaY))) }
        : item));
    };
    const onPointerUp = () => { dragRef.current = null; };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  const generatedMarkup = useMemo(() => elements.map((item) => {
    const node = (() => {
    const style = { color: item.color, fontSize: `${Number(item.fontSize) || 16}px`, textAlign: item.align || 'left', width: '100%', margin: '0', fontWeight: item.type === 'heading' ? 750 : 400, outline: selectedId === item.id ? '1px solid #a78bfa' : '1px solid transparent', outlineOffset: '4px', cursor: 'pointer' };
    const selectElement = (event) => { event.stopPropagation(); setSelectedId(item.id); };
    if (item.type === 'button') return <button key={item.id} style={{ ...style, background: item.background || '#8b5cf6', border: 0, borderRadius: 9, padding: '12px 20px', cursor: 'pointer' }} onClick={selectElement}>{item.text}</button>;
    if (item.type === 'toggle') {
      const checked = Boolean(controlStates[item.id]);
      return <div key={item.id} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: item.align === 'left' ? 'flex-start' : item.align === 'right' ? 'flex-end' : 'center', gap: 10 }} onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); setControlStates((state) => ({ ...state, [item.id]: !state[item.id] })); }}><span>{item.text}</span><span style={{ width: 42, height: 24, borderRadius: 20, background: checked ? (item.background || '#8b5cf6') : '#4b4d58', padding: 3, display: 'inline-flex', justifyContent: checked ? 'flex-end' : 'flex-start', boxSizing: 'border-box' }}><span style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff' }} /></span></div>;
    }
    if (item.type === 'checkbox') {
      const checked = Boolean(controlStates[item.id]);
      return <label key={item.id} style={{ ...style, display: 'flex', alignItems: 'center', justifyContent: item.align === 'left' ? 'flex-start' : item.align === 'right' ? 'flex-end' : 'center', gap: 9, cursor: 'pointer' }} onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); setControlStates((state) => ({ ...state, [item.id]: !state[item.id] })); }}><input type="checkbox" checked={checked} readOnly style={{ width: 17, height: 17, accentColor: item.background || '#8b5cf6' }}/>{item.text}</label>;
    }
    if (item.type === 'tabs') return <div key={item.id} style={{ ...style, display: 'flex', gap: 6, justifyContent: item.align === 'left' ? 'flex-start' : item.align === 'right' ? 'flex-end' : 'center', flexWrap: 'wrap' }} onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); }}>{(item.text || 'Início, Sobre, Contato').split(',').map((tab, index) => <button key={index} onClick={(event) => { event.stopPropagation(); setSelectedId(item.id); setControlStates((state) => ({ ...state, [item.id]: index })); }} style={{ border: 0, borderRadius: 7, padding: '9px 13px', color: '#fff', background: (controlStates[item.id] ?? 0) === index ? (item.background || '#8b5cf6') : '#292b36', cursor: 'pointer' }}>{tab.trim()}</button>)}</div>;
    if (item.type === 'image') return <img key={item.id} src={item.text} alt="" style={{ ...style, display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 12 }} onClick={selectElement} />;
    if (item.type === 'box') return <div key={item.id} style={{ width: '100%', minHeight: 90, margin: '0', background: item.background || '#262a3a', border: '1px solid #ffffff25', borderRadius: 12, outline: selectedId === item.id ? '1px solid #a78bfa' : '1px solid transparent', cursor: 'pointer' }} onClick={selectElement} />;
    if (item.type === 'heading') return <h1 key={item.id} style={style} onClick={selectElement}>{item.text}</h1>;
    return <p key={item.id} style={style} onClick={selectElement}>{item.text}</p>;
    })();
    return <div key={item.id} data-vynex-element={item.id} className={selectedId === item.id ? 'design-canvas-element selected' : 'design-canvas-element'} style={{ width: (Math.max(10, Math.min(100, Number(item.width) || 100))) + '%', margin: '12px auto', position: 'relative', transform: 'translate(' + (Number(item.x) || 0) + 'px, ' + (Number(item.y) || 0) + 'px)' }}>
      {selectedId === item.id && <button type="button" className="design-drag-handle" title="Arraste para mover a camada" onPointerDown={(event) => beginCanvasMove(event, item.id)} onClick={(event) => event.stopPropagation()} aria-label="Mover elemento">⠿</button>}
      {node}
      {selectedId === item.id && <button type="button" className="design-resize-handle" title="Arraste para redimensionar" onPointerDown={(event) => beginCanvasResize(event, item)} onClick={(event) => event.stopPropagation()} aria-label="Redimensionar elemento">↘</button>}
    </div>;
  }), [elements, controlStates, selectedId]);

  if (!projectLoaded) return <main className="vynex-design-loading">Abrindo editor visual…</main>;

  return (
    <main className="vynex-design">
      <header className="design-topbar">
        <a href="/projects" className="design-back"><ArrowLeft size={16}/> Workspace</a>
        <div className="design-brand"><span>V</span><b>Vynex Design</b><small>EDITOR VISUAL</small></div>
        <div className="design-top-actions">
          <select aria-label="Projeto" value={activeId} onChange={(event) => {
            const id = event.target.value; setActiveId(id);
            const project = projects.find((item) => item.id === id);
            const file = project?.files?.find((item) => item.path === DESIGN_PATH);
            if (file) { try { const d = JSON.parse(decodeBase64(file.contentBase64)); setElements(d.elements || STARTER); setBackground(d.background || '#11131c'); setSelectedId(d.elements?.[0]?.id || ''); } catch {} }
            else { setElements(STARTER); setBackground('#11131c'); setSelectedId(STARTER[0].id); }
          }}>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <button className="design-save" onClick={() => persistDesign()} disabled={!activeProject}><Save size={15}/> Salvar</button>
        </div>
      </header>

      <div className="design-layout">
        <aside className="design-left-panel">
          <div className="design-panel-heading"><Layers3 size={15}/> ELEMENTOS</div>
          <div className="design-add-grid">
            <button onClick={() => addElement('heading')}><Type size={17}/><span>Título</span></button>
            <button onClick={() => addElement('text')}><Type size={16}/><span>Texto</span></button>
            <button onClick={() => addElement('button')}><MousePointer2 size={16}/><span>Botão</span></button>
            <button onClick={() => addElement('box')}><Square size={16}/><span>Bloco</span></button>
            <button onClick={() => addElement('image')}><ImageIcon size={16}/><span>Imagem</span></button>
            <button onClick={() => addElement('toggle')}><span className="design-mini-toggle"/><span>Toggle</span></button>
            <button onClick={() => addElement('checkbox')}><span className="design-mini-checkbox">✓</span><span>Checkbox</span></button>
            <button onClick={() => addElement('tabs')}><Layers3 size={16}/><span>Abas</span></button>
          </div>
          <div className="design-panel-heading design-layers-heading">CAMADAS <span>{elements.length}</span></div>
          <div className="design-layer-list">
            {elements.map((item, index) => <button key={item.id} className={selectedId === item.id ? 'design-layer selected' : 'design-layer'} onClick={() => setSelectedId(item.id)}>
              {item.type === 'heading' ? <Type size={14}/> : item.type === 'button' ? <MousePointer2 size={14}/> : item.type === 'image' ? <ImageIcon size={14}/> : item.type === 'toggle' ? <span className="design-mini-toggle"/> : item.type === 'checkbox' ? <span className="design-mini-checkbox">✓</span> : item.type === 'tabs' ? <Layers3 size={14}/> : <Square size={14}/>}
              <span>{item.text || (item.type === 'box' ? 'Bloco' : item.type)}</span><small>{index + 1}</small>
            </button>)}
            {!elements.length && <p className="design-empty">Adicione um elemento para começar.</p>}
          </div>
          <p className="design-hint">Arraste ⠿ para mover e ↘ para redimensionar. Use as propriedades para ajustar o visual e salve para incluir no aplicativo.</p>
        </aside>

        <section className="design-center">
          <div className="design-toolbar">
            <span><Eye size={14}/> Pré-visualização</span>
            <div>
              <button className={device === 'desktop' ? 'active' : ''} onClick={() => setDevice('desktop')}><Monitor size={15}/> Desktop</button>
              <button className={device === 'mobile' ? 'active' : ''} onClick={() => setDevice('mobile')}><Smartphone size={15}/> Mobile</button>
            </div>
          </div>
          <div className="design-stage">
            <div ref={canvasRef} className={device === 'mobile' ? 'design-canvas mobile' : 'design-canvas'} style={{ background }}>
              <div className="design-canvas-inner" onClick={() => setSelectedId('')}>
                {generatedMarkup}
              </div>
              <div className="design-canvas-caption">{activeProject?.name || 'Projeto sem nome'} · {device === 'mobile' ? '390 px' : '1200 px'}</div>
            </div>
          </div>
          {notice && <div className="design-notice">{notice}</div>}
        </section>

        <aside className="design-right-panel">
          <div className="design-panel-heading">PROPRIEDADES</div>
          {selected ? <>
            <label className="design-field"><span>Texto / conteúdo</span><textarea rows={3} value={selected.text} onChange={(event) => updateSelected('text', event.target.value)} /></label>
            {selected.type === 'image' && <label className="design-field"><span>URL da imagem</span><input value={selected.text} onChange={(event) => updateSelected('text', event.target.value)} placeholder="https://..." /></label>}
            <label className="design-field"><span>Largura (%)</span><input type="number" min="10" max="100" value={selected.width} onChange={(event) => updateSelected('width', Math.max(10, Math.min(100, Number(event.target.value) || 10)))} /></label>
            {selected.type !== 'image' && selected.type !== 'box' && <label className="design-field"><span>Tamanho do texto</span><input type="number" min="10" max="96" value={selected.fontSize} onChange={(event) => updateSelected('fontSize', Math.max(10, Math.min(96, Number(event.target.value) || 16)))} /></label>}
            <label className="design-field"><span>Cor do texto</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(selected.color || '') ? selected.color : '#ffffff'} onChange={(event) => updateSelected('color', event.target.value)} /></label>
            {(['button', 'box', 'toggle', 'checkbox', 'tabs'].includes(selected.type)) && <label className="design-field"><span>Cor de fundo / destaque</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(selected.background || '') ? selected.background : '#262a3a'} onChange={(event) => updateSelected('background', event.target.value)} /></label>}
            <label className="design-field"><span>Alinhamento</span><select value={selected.align || 'left'} onChange={(event) => updateSelected('align', event.target.value)}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select></label>
            <div className="design-property-actions">
              <button onClick={() => moveSelected(-1)} title="Mover para cima"><ChevronUp size={15}/></button>
              <button onClick={() => moveSelected(1)} title="Mover para baixo"><ChevronDown size={15}/></button>
              <button className="danger" onClick={removeSelected} title="Remover elemento"><Trash2 size={15}/> Remover</button>
            </div>
          </> : <div className="design-no-selection">Selecione um elemento na tela ou na lista de camadas.</div>}
          <div className="design-background">
            <div className="design-panel-heading">PÁGINA</div>
            <label className="design-field"><span>Cor de fundo</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(background) ? background : '#11131c'} onChange={(event) => setBackground(event.target.value)} /></label>
          </div>
        </aside>
      </div>
    </main>
  );
}
