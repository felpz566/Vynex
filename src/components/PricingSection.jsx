import { useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

const plans = [
  { name: 'Free', label: 'PARA COMEÇAR', description: 'Experimente suas ideias e conheça o fluxo de criação.', monthly: 'R$ 0', yearly: 'R$ 0', period: '/ sempre', button: 'Começar grátis', featuresTitle: 'INCLUI', features: ['Editor visual básico', 'Editor de código + autocomplete', 'Projetos de demonstração', 'Prévia da interface'] },
  { name: 'Pro', label: 'PARA CRIADORES', description: 'Para quem quer construir projetos mais completos.', monthly: 'R$ 29,90', yearly: 'R$ 23,90', button: 'Conhecer o Pro', featuresTitle: 'TUDO DO FREE, MAIS', features: ['Projetos privados', 'Builds para Windows (.exe)', 'Mais builds e recursos', 'Assistência de IA opcional'], featured: true },
  { name: 'Creator', label: 'PARA PUBLICAR', description: 'Mais formatos e ferramentas para tirar projetos do papel.', monthly: 'R$ 59,90', yearly: 'R$ 47,90', button: 'Explorar Creator', featuresTitle: 'TUDO DO PRO, MAIS', features: ['Exportação Android (APK/AAB)', 'Mais capacidade de build', 'Configurações de publicação', 'Recursos avançados'] },
];

export default function PricingSection({ onStart, onNotify }) {
  const [billing, setBilling] = useState('mensal');

  return (
    <section className="pricing-section section-wrap" id="planos">
      <div className="pricing-heading">
        <div className="section-kicker"><span /> PLANOS PARA CADA FASE</div>
        <h2>Comece grátis.<br/><span className="muted-heading">Cresça no seu ritmo.</span></h2>
        <p>O essencial para começar sem cartão de crédito. Mais recursos quando você precisar.</p>
        <div className="billing-toggle">
          <button className={billing === 'mensal' ? 'billing-active' : ''} onClick={() => setBilling('mensal')}>Mensal</button>
          <button className={billing === 'anual' ? 'billing-active' : ''} onClick={() => setBilling('anual')}>Anual <span>Economize</span></button>
        </div>
      </div>
      <div className="pricing-grid">
        {plans.map(plan => (
          <article className={'price-card' + (plan.featured ? ' price-featured' : '')} key={plan.name}>
            {plan.featured && <div className="popular-pill"><Sparkles size={12}/> MAIS LIBERDADE</div>}
            <div className="plan-label">{plan.label}</div><h3>{plan.name}</h3><p>{plan.description}</p>
            <div className="price-value"><strong>{billing === 'mensal' ? plan.monthly : plan.yearly}</strong><span>{plan.period || '/ mês' + (billing === 'anual' ? ' · cobrado anualmente' : '')}</span></div>
            <button className={'plan-button ' + (plan.featured ? 'plan-button-primary' : 'plan-button-light')} onClick={plan.name === 'Free' ? onStart : () => onNotify(plan.name === 'Pro' ? 'Os pagamentos serão disponibilizados quando os builds estiverem prontos.' : 'O plano Creator será disponibilizado em uma próxima etapa.')}>{plan.button} <ArrowRight size={14}/></button>
            <div className="plan-divider"/><span className="includes-label">{plan.featuresTitle}</span>
            {plan.features.map(feature => <div className="plan-feature" key={feature}><Check size={14}/>{feature}</div>)}
          </article>
        ))}
      </div>
      <p className="pricing-note">Preços ilustrativos para planejamento. Assinaturas e exportações ainda não estão ativas.</p>
    </section>
  );
}
