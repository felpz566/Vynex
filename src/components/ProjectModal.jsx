import { ArrowRight, Blocks, Check, Code2, Plus, X } from 'lucide-react';

export default function ProjectModal({ projectName, setProjectName, onClose, onCreate, onNotify }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
      <form className="project-modal" onSubmit={onCreate}>
        <button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}><X size={18}/></button>
        <div className="modal-icon"><Plus size={22}/></div>
        <div className="section-kicker"><span/> VAMOS COMEÇAR</div>
        <h2>Crie seu projeto</h2><p>Dê um nome à sua ideia. Você poderá mudar depois.</p>
        <label htmlFor="project-name">Nome do projeto</label>
        <input autoFocus id="project-name" value={projectName} onChange={event => setProjectName(event.target.value)} placeholder="Ex.: Meu aplicativo" maxLength={48} required/>
        <div className="modal-choice-label">COMO QUER COMEÇAR?</div>
        <button type="button" className="start-option selected-option" onClick={() => onNotify('O editor visual fará parte do próximo passo.')}><span className="option-icon"><Blocks size={17}/></span><span><b>Editor visual</b><small>Comece montando a interface</small></span><span className="option-radio"><Check size={12}/></span></button>
        <button type="button" className="start-option" onClick={() => onNotify('O editor de código fará parte do próximo passo.')}><span className="option-icon option-code"><Code2 size={17}/></span><span><b>Começar pelo código</b><small>Para quem prefere escrever código</small></span><span className="option-radio empty-radio"/></button>
        <button type="submit" className="primary-button modal-submit">Criar projeto <ArrowRight size={15}/></button>
        <small className="modal-disclaimer">Protótipo visual · Nenhum dado é enviado para um servidor.</small>
      </form>
    </div>
  );
}
