import { ArrowUpRight, Blocks, Code2, Download } from 'lucide-react';

const features = [
  { icon: Blocks, title: 'Monte visualmente', description: 'Arraste componentes para a tela e ajuste cada detalhe sem brigar com configurações.' },
  { icon: Code2, title: 'Código de verdade', description: 'Edite a lógica em um editor completo, com autocomplete e realce de sintaxe desde o plano grátis.' },
  { icon: Download, title: 'Pronto para compilar', description: 'Prepare seu projeto para Windows e, nos planos compatíveis, Android.' },
];

export default function FeatureSection() {
  return (
    <section className="feature-section section-wrap" id="recursos">
      <div className="section-kicker"><span /> CRIADO PARA O SEU FLUXO</div>
      <div className="section-heading-row">
        <h2>Visual quando quiser.<br/><span className="muted-heading">Código quando precisar.</span></h2>
        <p>Você não precisa escolher entre facilidade e controle. Na Vynex, os dois trabalham juntos.</p>
      </div>
      <div className="feature-grid">
        {features.map(({ icon: Icon, title, description }, index) => (
          <article className="feature-card" key={title}>
            <div className={'feature-icon icon-' + index}><Icon size={20}/></div>
            <span className="feature-number">0{index + 1}</span>
            <h3>{title}</h3><p>{description}</p>
            <a href="#como-funciona">Explorar recurso <ArrowUpRight size={14}/></a>
          </article>
        ))}
      </div>
    </section>
  );
}
