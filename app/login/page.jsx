'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Github, Globe2, LoaderCircle, Mail, ShieldCheck } from 'lucide-react';
import './login.css';

export default function LoginPage() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/google/status', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json();
        setStatus(data);
      })
      .catch(() => setStatus({ configured: false, connected: false }));

    const params = new URLSearchParams(window.location.search);
    if (params.get('google') === 'error') setError('Não foi possível entrar com Google. Verifique a configuração OAuth e tente novamente.');
    if (params.has('google') || params.has('logged_out')) {
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  return (
    <main className="vynex-login">
      <a className="login-back" href="/"><ArrowLeft size={16}/> Voltar ao Vynex</a>
      <section className="login-card">
        <div className="login-brand-mark">V</div>
        <span className="login-kicker">SUA CONTA VYNEX</span>
        <h1>Seus projetos.<br/><span>Em qualquer dispositivo.</span></h1>
        <p className="login-description">Entre para acessar sua conta Vynex. A conexão com Google e a conexão com GitHub são independentes.</p>

        {status?.connected && <div className="login-connected"><CheckCircle2 size={17}/><span>Google conectado como <b>{status.email}</b></span></div>}
        {error && <div className="login-error">{error}</div>}

        <div className="login-providers">
          <a className="login-google" href="/api/auth/google/start"><GoogleGlyph/> Continuar com Google</a>
          <a className="login-github" href="/api/integrations/github/start?next=%2Fprojects"><Github size={18}/> Continuar com GitHub</a>
        </div>

        {status && !status.configured && <p className="login-config-note"><ShieldCheck size={15}/> O login Google precisa ser configurado nas variáveis de ambiente da Vercel antes de funcionar.</p>}
        <div className="login-divider"><span/></div>
        <div className="login-trust"><ShieldCheck size={15}/><span>Autorização segura. O Client Secret nunca é enviado ao navegador.</span></div>
        <a className="login-create-project" href="/projects"><Globe2 size={15}/> Continuar sem entrar <span>→</span></a>
      </section>
      <footer className="login-footer"><span>VYNEX STUDIO</span><span>Feito para construir, em qualquer lugar.</span></footer>
    </main>
  );
}

function GoogleGlyph() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.23c1.89-1.74 2.99-4.3 2.99-7.37Z"/><path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.63-2.4l-3.23-2.52c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.12H3.05v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.92a6.02 6.02 0 0 1 0-3.84v-2.6H3.05a10 10 0 0 0 0 9.04l3.34-2.6Z"/><path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.96 2.98 14.7 2 12 2a10 10 0 0 0-8.95 5.48l3.34 2.6C7.18 7.72 9.39 5.96 12 5.96Z"/></svg>;
}
