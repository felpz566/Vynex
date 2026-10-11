'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, CircleHelp, CornerDownLeft, Terminal as TerminalIcon, Trash2 } from 'lucide-react';

function decodeContent(value) {
  try {
    const binary = atob(value || '');
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return '';
  }
}

function encodeContent(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function cleanPath(path) {
  const parts = path.replace(/^\.\//, '').split('/').filter(Boolean);
  if (!parts.length || parts.some((part) => part === '.' || part === '..')) return null;
  return parts.join('/');
}

function tokenize(command) {
  const parts = [];
  const matcher = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = matcher.exec(command))) parts.push(match[1] ?? match[2] ?? match[3]);
  return parts;
}

export default function ProjectTerminal({ projectName, files, onChangeFiles }) {
  const [expanded, setExpanded] = useState(true);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [directories, setDirectories] = useState([]);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  const entries = useMemo(() => files.map((file) => ({
    path: file.path,
    content: decodeContent(file.contentBase64),
    size: file.size || 0,
  })), [files]);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [history, expanded]);

  const runCommand = (rawCommand) => {
    const command = rawCommand.trim();
    if (!command) return;
    const result = (text, type = 'normal') => ({ command, text, type, id: crypto.randomUUID() });
    const parts = tokenize(command);
    const [program, ...args] = parts;
    let output = [];
    const fileMap = new Map(entries.map((entry) => [entry.path, entry]));
    const resolve = (path = '.') => path === '.' || path === './' ? '' : cleanPath(path);
    const fail = (message) => { output = [result(message, 'error')]; };

    if (program === 'clear' || program === 'cls') {
      setHistory([]);
      setInput('');
      return;
    } else if (program === 'help' || program === 'vynex') {
      output = [
        result('Terminal do Vynex — comandos disponíveis:', 'success'),
        result('pwd              mostra o diretório atual'),
        result('ls [caminho]     lista arquivos e pastas'),
        result('tree             mostra a estrutura do projeto'),
        result('cat <arquivo>    exibe o conteúdo de um arquivo'),
        result('touch <arquivo>  cria um arquivo vazio'),
        result('mkdir <pasta>    cria uma pasta virtual'),
        result('echo "texto" > arquivo  cria/substitui o conteúdo'),
        result('rm <arquivo>     remove um arquivo do projeto'),
        result('clear            limpa o terminal'),
        result('help             mostra esta ajuda'),
        result('Nota: comandos de sistema como npm, node e git precisam de um runtime sandbox; este terminal altera os arquivos do workspace.', 'muted')
      ];
    } else if (program === 'pwd') {
      output = [result('/workspace/' + (projectName || 'projeto'))];
    } else if (program === 'ls' || program === 'dir') {
      const base = resolve(args[0] || '.');
      if (args[0] && base === null) fail('Caminho inválido.');
      else {
        const prefix = base ? base + '/' : '';
        const names = new Set();
        entries.forEach(({ path }) => {
          if (!path.startsWith(prefix)) return;
          const remainder = path.slice(prefix.length);
          if (remainder) names.add(remainder.split('/')[0] + (remainder.includes('/') ? '/' : ''));
        });
        directories.forEach((path) => {
          if (!path.startsWith(prefix)) return;
          const remainder = path.slice(prefix.length);
          if (remainder) names.add(remainder.split('/')[0] + '/');
        });
        output = names.size ? [...names].sort().map((name) => result(name, name.endsWith('/') ? 'directory' : 'normal')) : [result('Diretório vazio.', 'muted')];
      }
    } else if (program === 'tree') {
      const paths = [...new Set([...entries.map((entry) => entry.path), ...directories.map((path) => path + '/')])].sort();
      output = paths.length ? paths.map((path, index) => result((index === paths.length - 1 ? '└── ' : '├── ') + path)) : [result('Projeto vazio.', 'muted')];
    } else if (program === 'cat' || program === 'type') {
      const path = resolve(args[0]);
      if (!path) fail('Informe um arquivo: cat <arquivo>');
      else if (!fileMap.has(path)) fail('Arquivo não encontrado: ' + path);
      else output = [result(fileMap.get(path).content || '(arquivo vazio)', 'content')];
    } else if (program === 'touch') {
      const path = resolve(args[0]);
      if (!path) fail('Informe o caminho: touch <arquivo>');
      else if (fileMap.has(path)) output = [result('O arquivo já existe: ' + path, 'muted')];
      else {
        onChangeFiles([...files, { path, contentBase64: encodeContent(''), size: 0 }]);
        output = [result('Arquivo criado: ' + path, 'success')];
      }
    } else if (program === 'mkdir') {
      const path = resolve(args[0]);
      if (!path) fail('Informe a pasta: mkdir <pasta>');
      else if (directories.includes(path)) output = [result('A pasta já existe: ' + path, 'muted')];
      else {
        setDirectories((current) => [...current, path]);
        output = [result('Pasta criada: ' + path, 'success')];
      }
    } else if (program === 'rm' || program === 'del' || program === 'remove') {
      const path = resolve(args[0]);
      if (!path) fail('Informe o arquivo: rm <arquivo>');
      else if (!fileMap.has(path)) fail('Arquivo não encontrado: ' + path);
      else {
        onChangeFiles(files.filter((file) => file.path !== path));
        output = [result('Arquivo removido: ' + path, 'success')];
      }
    } else if (program === 'echo') {
      const redirectAt = command.indexOf('>');
      if (redirectAt < 0) output = [result(args.join(' '))];
      else {
        const left = command.slice(0, redirectAt).trim().replace(/^echo\s+/, '');
        const text = left.replace(/^(['"])(.*)\1$/, '$2');
        const path = cleanPath(command.slice(redirectAt + 1).trim());
        if (!path) fail('Uso: echo "texto" > arquivo');
        else {
          const next = { path, contentBase64: encodeContent(text + '\n'), size: new TextEncoder().encode(text + '\n').length };
          onChangeFiles(fileMap.has(path) ? files.map((file) => file.path === path ? next : file) : [...files, next]);
          output = [result('Conteúdo gravado em ' + path, 'success')];
        }
      }
    } else if (program === 'npm' || program === 'node' || program === 'git' || program === 'python' || program === 'python3') {
      output = [result('"' + program + '" requer um ambiente de execução isolado. O runtime de terminal ainda não está conectado neste workspace.', 'error')];
    } else {
      output = [result(program + ': comando não encontrado. Digite "help" para ver os comandos disponíveis.', 'error')];
    }

    setHistory((current) => [...current, result(command, 'command'), ...output]);
    setInput('');
    setHistoryIndex(-1);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    runCommand(input);
  };

  return (
    <section className={expanded ? 'project-terminal expanded' : 'project-terminal'}>
      <header className="project-terminal-header">
        <div className="project-terminal-title"><TerminalIcon size={15}/><b>Terminal</b><span>workspace</span></div>
        <div className="project-terminal-controls">
          <button type="button" title="Ajuda" aria-label="Ajuda do terminal" onClick={() => runCommand('help')}><CircleHelp size={14}/></button>
          <button type="button" title="Limpar" aria-label="Limpar terminal" onClick={() => setHistory([])}><Trash2 size={14}/></button>
          <button type="button" title={expanded ? 'Recolher terminal' : 'Expandir terminal'} aria-label={expanded ? 'Recolher terminal' : 'Expandir terminal'} onClick={() => setExpanded((value) => !value)}>{expanded ? <ChevronDown size={15}/> : <ChevronUp size={15}/>}</button>
        </div>
      </header>
      {expanded && <>
        <div className="project-terminal-output" ref={outputRef} onClick={() => inputRef.current?.focus()} role="log" aria-live="polite">
          <div className="project-terminal-welcome">Vynex Shell <span>·</span> {projectName || 'workspace'}<br/>Digite <code>help</code> para ver os comandos.</div>
          {history.map((item) => item.type === 'command'
            ? <div className="project-terminal-line project-terminal-command" key={item.id}><span>›</span><code>{item.text}</code></div>
            : <pre className={'project-terminal-line project-terminal-' + item.type} key={item.id}>{item.text}</pre>)}
        </div>
        <form className="project-terminal-input-row" onSubmit={handleSubmit}>
          <span>›</span>
          <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'ArrowUp') {
              event.preventDefault();
              const commands = history.filter((item) => item.type === 'command');
              const next = Math.min(historyIndex + 1, commands.length - 1);
              setHistoryIndex(next);
              if (commands.length) setInput(commands[commands.length - 1 - next].text);
            } else if (event.key === 'ArrowDown' && historyIndex >= 0) {
              event.preventDefault();
              const next = historyIndex - 1;
              setHistoryIndex(next);
              setInput(next < 0 ? '' : history.filter((item) => item.type === 'command').slice().reverse()[next]?.text || '');
            }
          }} placeholder="Digite um comando..." autoComplete="off" spellCheck="false" aria-label="Comando do terminal"/>
          <button type="submit" aria-label="Executar comando"><CornerDownLeft size={15}/></button>
        </form>
        <footer className="project-terminal-footer"><span><i/> Pronto</span><span>{files.length} arquivos no projeto</span></footer>
      </>}
    </section>
  );
}
