// Evidence check: every claim on the triage card is matched against the raw trace.
// A diagnosis (local or from an LLM) only earns "verified" marks for facts the trace actually contains.

export const norm = (s) => (s || '').replace(/\\\\/g, '\\').replace(/\s+/g, ' ').trim().toLowerCase();

// Codes the engine reports under their official name, which some traces only show as a phrase
const ERROR_ALIASES = { MODULE_NOT_FOUND: 'cannot find module' };

// Words too common to count as evidence on their own
const GENERIC_WORDS = new Set(['error', 'errors', 'failure', 'failed', 'command', 'runtime', 'exception', 'blocked']);

function basename(path) {
  return (path || '').split(/[\\/]/).pop();
}

export function groundReport(report, rawText) {
  if (!report) return { checks: [], verified: 0, total: 0 };

  const trace = norm(rawText);
  const checks = [];

  // 1. Error type named in the trace
  if (report.errorType && report.confidence !== 'low') {
    const tokens = report.errorType.split(/[\s()]+/).filter(t => t.length >= 4 && !GENERIC_WORDS.has(t.toLowerCase()));
    const alias = ERROR_ALIASES[report.errorType];
    const hit = trace.includes(norm(report.errorType)) || tokens.some(t => trace.includes(norm(t))) || (!!alias && trace.includes(alias));
    checks.push({ label: `Error type "${report.errorType}" appears in the trace${alias ? ` (or as "${alias}")` : ''}`, ok: hit });
  }

  // 2. Fault location appears in the trace (file name, and line number when given)
  const loc = report.location || '';
  const fileMatch = loc.match(/([\w.\-\\/]+\.[a-z0-9]+)(?::(\d+))?/i);
  if (fileMatch) {
    const file = basename(fileMatch[1]);
    const fileHit = trace.includes(norm(file));
    const lineHit = !fileMatch[2] || new RegExp(`(line |:)${fileMatch[2]}\\b`).test(trace);
    checks.push({ label: `Location ${loc} is in the trace`, ok: fileHit && lineHit });
  }

  // 3. Offending code line is quoted from the trace
  if (report.offendingCode && report.offendingCode.length > 3) {
    checks.push({ label: 'Highlighted code line is quoted from the trace', ok: trace.includes(norm(report.offendingCode)) });
  }

  // 4. Packages / names in the fix command come from the trace
  // (the package is the first argument that isn't a flag; "npm install --legacy-peer-deps" names none)
  const install = (report.fixCommand || '').match(/\b(?:npm (?:install|i)|pip install|yarn add|pnpm add)\s+(?!-)([@\w.\-/]+)/i);
  if (install) {
    const pkg = install[1];
    const root = pkg.startsWith('@') ? pkg.split('/').slice(0, 2).join('/') : pkg.split('/')[0];
    checks.push({ label: `Package "${pkg}" is named in the trace`, ok: trace.includes(norm(root)) || aliasHit(root, trace) });
  }

  // 5. Evidence quotes returned by the LLM must exist verbatim
  for (const quote of report.evidence || []) {
    if (!quote || quote.length < 4) continue;
    const short = quote.length > 60 ? quote.slice(0, 57) + '...' : quote;
    checks.push({ label: `Quote: "${short}"`, ok: trace.includes(norm(quote)) });
  }

  const verified = checks.filter(c => c.ok).length;
  return { checks, verified, total: checks.length };
}

// pip package names that differ from the import name
const PIP_ALIASES = {
  'opencv-python': 'cv2', pillow: 'pil', 'scikit-learn': 'sklearn', pyyaml: 'yaml',
  beautifulsoup4: 'bs4', 'python-dotenv': 'dotenv', 'python-dateutil': 'dateutil',
};

export function aliasHit(pkg, trace) {
  const alias = PIP_ALIASES[pkg.toLowerCase()];
  return alias ? trace.includes(alias) : false;
}
