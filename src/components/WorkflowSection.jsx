import { ArrowRight, Blocks, Check, Code2, Monitor, Smartphone } from 'lucide-react';

export default function WorkflowSection({ onStart }) {
  return (
    <section className="workflow-section" id="como-funciona">
      <div className="section-wrap workflow-wrap">
        <div className="workflow-copy">
          <div className="section-kicker"><span /> SIMPLES ASSIM</div>
          <h2>Menos configuração.<br/><span className="gradient-text">Mais criação.</span></h2>
          <p>Comece pela interface, ajuste os detalhes e programe o comportamento. Você tem liberdade para evoluir do visual ao código sem recomeçar do zero.</p>
          <div className="workflow-steps">
            <div><span>01</span><div><b>Crie sua interface</b><small>Componentes visuais para montar suas telas.</small></div><Check size={15}/></div>
            <div><span>02</span><div><b>Adicione sua lógica</b><small>Editor com autocomplete, estrutura e dicas.</small></div><Check size={15}/></div>
            <div><span>03</span><div><b>Prepare seu aplicativo</b><small>Configure o projeto e inicie o processo de build.</small></div><ArrowRight size={15}/></div>
          </div>
          <button className="primary-button" onClick={onStart}>Quero experimentar <ArrowRight size={15}/></button>
        </div>
        <div className="workflow-visual">
          <div className="workflow-backdrop" />
          <div className="workflow-card">
            <div className="workflow-card-top"><span><span className="status-dot"/> MEU PROJETO</span><span>v0.1</span></div>
            <div className="workflow-app-icon"><Blocks size={27}/></div>
            <h3>Meu aplicativo</h3><p>Seu próximo projeto começa aqui.</p>
            <div className="workflow-progress"><span/></div>
            <div className="workflow-progress-label"><span>Preparando projeto</span><b>Pronto para começar</b></div>
            <div className="workflow-platforms"><span><Monitor size={15}/> Windows</span><span><Smartphone size={15}/> Android</span></div>
          </div>
          <div className="workflow-float float-code"><Code2 size={15}/><span>App.tsx</span><span className="float-file-dot"/></div>
          <div className="workflow-float float-check"><span className="check-circle"><Check size={13}/></span><span><b>Seu projeto</b><small>Organizado e editável</small></span></div>
        </div>
      </div>
    </section>
  );
}
