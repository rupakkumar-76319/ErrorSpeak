// Checks an answer from any chat AI (ChatGPT, Gemini, Claude...) against the user's own error.
// No API key needed: the user copies a redacted prompt out, pastes the AI's reply back in,
// and every file, package, command and quote in the reply is checked here, in the browser.
import { redactSecrets } from './redact.js';
import { lintCommand } from './safety.js';
import { norm, aliasHit } from './grounding.js';

export function buildSafePrompt(rawText) {
  const { text, findings } = redactSecrets(rawText);
  const prompt = `I got this error. Explain the cause in plain English and give the smallest safe fix.

Some values were replaced with placeholders like <PASSWORD> or <USER>. Keep them as they are.

End your answer with a section headed EVIDENCE: copy 1 to 4 lines from the error exactly as written, one per line.

\`\`\`
${text}
\`\`\``;
  return { prompt, findings };
}

// Project files an AI may rightly ask you to edit even though the error never names them
const PROJECT_FILES = new Set([
  'package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'tsconfig.json', 'vite.config.js', 'vite.config.ts',
  'requirements.txt', 'pyproject.toml', 'setup.py', 'setup.cfg', 'pipfile', 'poetry.lock', '.env', '.gitignore',
  'dockerfile', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml', 'cargo.toml', 'go.mod', 'pom.xml', 'build.gradle',
]);
// Library names that look like file names
const NOT_FILES = new Set(['node.js', 'next.js', 'nuxt.js', 'vue.js', 'react.js', 'express.js', 'three.js', 'chart.js', 'd3.js', 'socket.io']);

const FILE = /(?:^|[\s`'"(\[])((?:[\w.\-]+[\\/])*[\w\-][\w.\-]*\.(?:py|js|jsx|ts|tsx|mjs|cjs|json|java|kt|go|rs|rb|php|cs|cpp|c|h|swift|ya?ml|toml|cfg|ini|sh|ps1|sql|vue|svelte|lock|txt|env))(?:[`'"]?(?::|,?\s+line\s+)(\d+))?(?![\w])/gi;
const DOCKERFILE = /(?:^|[\s`'"(])(Dockerfile)\b/g;

const COMMAND_START = /^(?:sudo\s+)?(?:npm|npx|yarn|pnpm|pip3?|python3?|py|node|git|docker(?:-compose)?|kubectl|rm|rmdir|Remove-Item|curl|wget|iwr|irm|Invoke-WebRequest|chmod|chown|apt(?:-get)?|brew|cargo|rustup|go|gem|bundle|composer|mkfs|dd|format|sh|bash|zsh|powershell|pwsh|Set-ExecutionPolicy|kill|killall|pkill|taskkill|lsof|netstat|code|mv|cp|psql|mysql|uv|poetry|pipenv|conda|DROP|TRUNCATE)\s+(?![=(])/i;
const SHELL_LANGS = /^(?:|bash|sh|shell|zsh|console|terminal|powershell|ps1|pwsh|cmd|bat|sql)$/i;
const PROMPT_PREFIX = /^\s*(?:\$|>|PS [^>]*>|[A-Z]:\\[^>]*>)\s*/;

const INSTALL = /\b(?:npm (?:install|i|add)|pnpm (?:add|install|i)|yarn add|pip3? install|python3? -m pip install|py -m pip install|poetry add|pipenv install|uv (?:pip install|add)|cargo add|gem install|go get|composer require)\s+(.+)/i;

function findCommands(answer) {
  const lines = [];
  const fence = /```([\w-]*)[^\n]*\n([\s\S]*?)```/g;
  let m;
  while ((m = fence.exec(answer))) {
    if (SHELL_LANGS.test(m[1])) lines.push(...m[2].split('\n'));
  }
  const prose = answer.replace(fence, ' ');
  for (const span of prose.matchAll(/`([^`\n]+)`/g)) lines.push(span[1]);

  const seen = new Set();
  return lines
    .map(l => l.replace(PROMPT_PREFIX, '').trim())
    .filter(l => l.length <= 300 && COMMAND_START.test(l) && !seen.has(l) && seen.add(l));
}

function packagesIn(cmd) {
  const m = cmd.match(INSTALL);
  if (!m) return [];
  const isNpm = /^(?:npm|pnpm|yarn)/i.test(cmd.slice(cmd.search(INSTALL)).trim());
  const args = m[1].split(/[\s;&|]+/);
  const pkgs = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i].replace(/^["']|["']$/g, '');
    if (!a || a === '.') continue;
    if (a.startsWith('-')) {
      if (/^-(?:r|e|c)$|^--(?:requirement|editable|constraint|index-url|extra-index-url)$/.test(a)) i++; // flag takes a file or URL
      continue;
    }
    if (/^(?:&&|\|\||>|2>)/.test(a)) break;
    const name = isNpm ? a.replace(/(?!^)@.*$/, '') : a.split(/[=<>!~[;]/)[0];
    if (name && !/^[.~/\\]/.test(name)) pkgs.push(name);
  }
  return pkgs;
}

function packageInTrace(pkg, traces) {
  // psycopg2-binary installs psycopg2
  const root = (pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0]).replace(/-binary$/i, '');
  const variants = [root, root.replace(/-/g, '_'), root.replace(/_/g, '-')].map(norm);
  return traces.some(t => variants.some(v => t.includes(v)) || aliasHit(root, t));
}

function evidenceLines(answer) {
  const lines = answer.split('\n');
  const start = lines.findIndex(l => /^\W*evidence\W*$/i.test(l.trim()));
  if (start < 0) return null;
  const out = [];
  let inFence = false;
  for (const line of lines.slice(start + 1)) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue; }
    if (!line.trim()) { if (out.length && !inFence) break; continue; }
    if (!inFence && out.length && /^\s*(?:#+\s|\*\*[^*]+\*\*:?\s*$)/.test(line)) break;
    const clean = line.trim().replace(/^(?:[-*•>]|\d+[.)])\s*/, '').replace(/^[`"“]+|[`"”]+$/g, '').trim();
    if (clean) out.push(clean);
    if (out.length === 6) break;
  }
  return out;
}

const RANK = { danger: 0, warn: 1, info: 2, ok: 3 };

export function checkAnswer(answer, rawText) {
  if (!answer || !answer.trim()) return { items: [], counts: { danger: 0, warn: 0, info: 0, ok: 0 } };

  // The AI saw the redacted trace, so a quote may carry <PASSWORD> where the original has the real value
  const traces = [norm(rawText), norm(redactSecrets(rawText).text)];
  const inTrace = (s) => traces.some(t => t.includes(norm(s)));
  const items = [];
  const noUrls = answer.replace(/https?:\/\/\S+/g, ' ');

  // 1. Commands: destructive or risky ones first, and any package they install
  const checkedPkgs = new Set();
  for (const cmd of findCommands(noUrls)) {
    const lint = lintCommand(cmd);
    if (lint.level === 'danger') items.push({ kind: 'command', status: 'danger', label: cmd, detail: lint.reasons.join(' ') });
    else if (lint.level === 'caution') items.push({ kind: 'command', status: 'warn', label: cmd, detail: lint.reasons.join(' ') });
    else items.push({ kind: 'command', status: 'ok', label: cmd, detail: 'No destructive pattern found.' });

    for (const pkg of packagesIn(cmd)) {
      if (checkedPkgs.has(pkg)) continue;
      checkedPkgs.add(pkg);
      items.push(packageInTrace(pkg, traces)
        ? { kind: 'package', status: 'ok', label: pkg, detail: 'Package is named in your error.' }
        : { kind: 'package', status: 'warn', label: pkg, detail: 'Not named in your error. AIs sometimes invent package names, and attackers publish malware under them. Check it on the official registry before installing.' });
    }
  }

  // 2. Files and line numbers
  const seenFiles = new Set();
  const fileRefs = [...noUrls.matchAll(FILE)].map(m => [m[1], m[2]]).concat([...noUrls.matchAll(DOCKERFILE)].map(m => [m[1], undefined]));
  for (const [path, line] of fileRefs) {
    const base = path.split(/[\\/]/).pop();
    const key = `${base.toLowerCase()}:${line || ''}`;
    if (NOT_FILES.has(base.toLowerCase()) || seenFiles.has(key)) continue;
    seenFiles.add(key);
    const label = line ? `${path}:${line}` : path;
    if (!inTrace(base)) {
      items.push(PROJECT_FILES.has(base.toLowerCase())
        ? { kind: 'file', status: 'info', label, detail: 'Not in your error, but a normal project file to edit. Fine if it exists in your project.' }
        : { kind: 'file', status: 'warn', label, detail: 'This file is not in your error. Check it exists before you edit it.' });
    } else if (line && !traces.some(t => new RegExp(`(line |:)${line}\\b`).test(t))) {
      items.push({ kind: 'file', status: 'warn', label, detail: `The file is in your error, but line ${line} is not.` });
    } else {
      items.push({ kind: 'file', status: 'ok', label, detail: 'Found in your error.' });
    }
  }

  // 3. Quotes the AI says it relied on
  const quotes = evidenceLines(answer);
  if (quotes === null) {
    items.push({ kind: 'quote', status: 'info', label: 'No EVIDENCE section', detail: 'Ask the AI to quote the lines of your error it relied on, so they can be checked.' });
  } else {
    for (const q of quotes.filter(q => q.length >= 4)) {
      items.push(inTrace(q)
        ? { kind: 'quote', status: 'ok', label: q, detail: 'Quoted exactly from your error.' }
        : { kind: 'quote', status: 'warn', label: q, detail: 'Not in your error. The AI changed or invented this line.' });
    }
  }

  items.sort((a, b) => RANK[a.status] - RANK[b.status]);
  const counts = { danger: 0, warn: 0, info: 0, ok: 0 };
  for (const it of items) counts[it.status]++;
  return { items, counts };
}
