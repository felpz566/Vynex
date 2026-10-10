import '../src/styles.css';

export const metadata = {
  title: 'Vynex — Crie seus aplicativos',
  description: 'Desenhe interfaces, escreva código e transforme seus projetos em aplicativos com o Vynex.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
