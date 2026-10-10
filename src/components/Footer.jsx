import { Github } from 'lucide-react';
import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Logo/><span>Uma ideia de cada vez. Um app de cada vez.</span>
        <div className="footer-links"><a href="#recursos">Recursos</a><a href="#planos">Planos</a><a href="https://github.com/felpz566/Vynex" target="_blank" rel="noreferrer"><Github size={14}/> GitHub</a></div>
      </div>
      <div className="footer-bottom"><span>© 2026 Vynex. Feito para quem cria.</span><span><span className="status-dot"/> Em desenvolvimento</span></div>
    </footer>
  );
}
