import { useState } from 'react';
import {
  ArrowRight, ArrowUpRight, Braces, Check, Code2, Download, Layers3,
  Menu, Monitor, Play, Smartphone, X
} from 'lucide-react';
import Logo from './components/Logo.jsx';
import WorkspacePreview from './components/WorkspacePreview.jsx';
import FeatureSection from './components/FeatureSection.jsx';
import WorkflowSection from './components/WorkflowSection.jsx';
import PricingSection from './components/PricingSection.jsx';
import Footer from './components/Footer.jsx';
import ProjectModal from './components/ProjectModal.jsx';

function Header({ onStart, onNotify }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className={menuOpen ? 'main-nav nav-open' : 'main-nav'}>
          <a href="#recursos" onClick={closeMenu}>Recursos</a>
          <a href="#como-funciona" onClick={closeMenu}>Como funciona</a>
          <a href="#planos" onClick={closeMenu}>Planos</a>
        </nav>
        <div className="header-actions">
          <button className="login-link" onClick={() => onNotify('O acesso à conta será ativado em breve.')}>Entrar</button>
          <button className="header-cta" onClick={onStart}>Começar grátis <ArrowUpRight size={15}/></button>
        </div>
        <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X/> : <Menu/>}
        </button>
      </div>
    </header>
  );
}

function HeroSection({ onStart }) {
  return (
    <section className="hero-section">
      <div className="hero-glow glow-one" /><div className="hero-glow glow-two" />
      <div className="hero-content">
        <div className="announcement"><span className="announcement-dot" /> UMA NOVA FORMA DE CRIAR SOFTWARE <ArrowRight size={13}/></div>
        <h1>Da sua ideia<br/>ao <span className="gradient-text">seu aplicativo.</span></h1>
        <p className="hero-subtitle">Desenhe interfaces, escreva código e transforme seus projetos em aplicativos. Tudo em um só lugar, do seu jeito.</p>
        <div className="hero-buttons">
          <button className="primary-button" onClick={onStart}>Comece de graça <ArrowRight size={16}/></button>
          <a className="secondary-button" href="#como-funciona"><span className="play-circle"><Play size={11} fill="currentColor"/></span> Conheça a plataforma</a>
        </div>
        <div className="hero-proof"><div className="proof-avatars"><span>V</span><span>⌘</span><span>{'{ }'}</span></div><span>Para quem está começando e para quem já programa.</span></div>
      </div>
      <div className="hero-product">
        <div className="product-orbit orbit-a" /><div className="product-orbit orbit-b" />
        <WorkspacePreview />
        <div className="floating-chip chip-autocomplete"><span className="chip-icon"><Code2 size={15}/></span><span><b>Autocomplete</b><small>Incluído no plano grátis</small></span><Check size={14} className="chip-check"/></div>
        <div className="floating-chip chip-build"><span className="build-icon"><Download size={16}/></span><span><b>Pronto para exportar</b><small>Seu app, sua liberdade</small></span></div>
      </div>
      <div className="hero-bottom">
        <span>UMA PLATAFORMA. MUITAS POSSIBILIDADES.</span>
        <div><span><Monitor size={14}/> Windows</span><span><Smartphone size={14}/> Android</span><span><Braces size={14}/> Código editável</span></div>
      </div>
    </section>
  );
}

function FinalCallToAction({ onStart }) {
  return (
    <section className="final-cta">
      <div className="cta-glow"/>
      <div className="section-kicker"><span /> SUA IDEIA MERECE EXISTIR</div>
      <h2>O próximo app pode<br/>começar <span className="gradient-text">aqui.</span></h2>
      <p>Uma ideia, um projeto e as ferramentas para tirar do papel.</p>
      <button className="primary-button" onClick={onStart}>Criar meu primeiro projeto <ArrowRight size={16}/></button>
      <small>Grátis para começar · Sem cartão de crédito</small>
    </section>
  );
}

export default function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [created, setCreated] = useState(false);
  const [toast, setToast] = useState('');

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  };

  const startProject = () => setModalOpen(true);

  const createProject = (event) => {
    event.preventDefault();
    if (!projectName.trim()) return;
    setCreated(true);
    setModalOpen(false);
    notify('Projeto criado! O editor estará disponível nesta etapa do produto.');
  };

  return (
    <div className="site-shell" id="inicio">
      <Header onStart={startProject} onNotify={notify}/>
      <main>
        <HeroSection onStart={startProject}/>
        <FeatureSection/>
        <WorkflowSection onStart={startProject}/>
        <PricingSection onStart={startProject} onNotify={notify}/>
        <FinalCallToAction onStart={startProject}/>
      </main>
      <Footer/>
      {modalOpen && <ProjectModal projectName={projectName} setProjectName={setProjectName} onClose={() => setModalOpen(false)} onCreate={createProject} onNotify={notify}/>}
      {created && <div className="created-banner"><span className="check-circle"><Check size={14}/></span><span><b>{projectName}</b><small>Projeto de demonstração criado nesta sessão.</small></span><button onClick={() => setCreated(false)} aria-label="Fechar"><X size={15}/></button></div>}
      {toast && <div className="toast-message"><Check size={15}/>{toast}</div>}
    </div>
  );
}
