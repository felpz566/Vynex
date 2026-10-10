import { Blocks, Braces, ChevronDown, Code2, MousePointer2, PanelLeft, Plus, Settings2, Type, Zap, ArrowRight } from 'lucide-react';

const components = [
  { label: 'Selecionar', icon: MousePointer2 },
  { label: 'Texto', icon: Type },
  { label: 'Botão', icon: Blocks },
  { label: 'Cartão', icon: PanelLeft },
  { label: 'Campo de texto', icon: Braces },
];

const layers = ['Página inicial', 'Cabeçalho', 'Bem-vindo', 'Botão principal'];

export function ComponentSidebar({ selected, onSelect }) {
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

export function PropertiesSidebar({ selected }) {
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
