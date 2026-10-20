// Command safety check: flags suggested fixes that can destroy work or weaken security,
// so a beginner never copy-pastes `git reset --hard` without knowing what it does.

const DANGER = [
  { pattern: /\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)\b/i, reason: 'Recursively force-deletes files with no undo.' },
  { pattern: /\bRemove-Item\b.*-Recurse\b.*-Force\b|\bRemove-Item\b.*-Force\b.*-Recurse\b/i, reason: 'Recursively force-deletes files with no undo.' },
  { pattern: /\bgit\s+reset\s+--hard\b/i, reason: 'Discards every uncommitted change in the repo.' },
  { pattern: /\bgit\s+clean\s+-[a-z]*f/i, reason: 'Permanently deletes untracked files.' },
  { pattern: /\bgit\s+push\b.*(--force\b|-f\b)(?!-with-lease)/i, reason: 'Overwrites history on the remote branch for everyone.' },
  { pattern: /\bgit\s+checkout\s+--\s+\./i, reason: 'Throws away all local edits.' },
  { pattern: /\bdocker\s+(system|volume)\s+prune\b/i, reason: 'Deletes Docker data, including volumes that may hold databases.' },
  { pattern: /\b(DROP\s+(TABLE|DATABASE)|TRUNCATE\s+TABLE)\b/i, reason: 'Deletes database data.' },
  { pattern: /\b(curl|wget|iwr|Invoke-WebRequest)\b[^|]*\|\s*(sudo\s+)?(ba|z)?sh\b|\|\s*iex\b/i, reason: 'Runs a script from the internet without letting you read it first.' },
  { pattern: /\bchmod\s+(-R\s+)?777\b/i, reason: 'Makes files writable by every user on the machine.' },
  { pattern: /\b(mkfs|format\s+[a-z]:|dd\s+if=)/i, reason: 'Can wipe a disk.' },
];

const CAUTION = [
  { pattern: /\bsudo\b/i, reason: 'Runs with administrator rights.' },
  { pattern: /--force\b|--legacy-peer-deps\b/i, reason: 'Skips safety checks; review what it overrides.' },
  { pattern: /--break-system-packages\b/i, reason: 'Can break the operating system Python.' },
  { pattern: /\bnpm\s+(install|i)\s+(-g|--global)\b/i, reason: 'Installs globally for every project on this machine.' },
  { pattern: /\bdocker\s+compose\s+down\b.*-v\b/i, reason: 'Also deletes named volumes.' },
  { pattern: /\bSet-ExecutionPolicy\b/i, reason: 'Changes PowerShell script security settings.' },
  { pattern: /<[a-z_]+>/i, reason: 'Contains a placeholder you must replace before running.' },
];

export function lintCommand(cmd) {
  if (!cmd || !cmd.trim()) return { level: 'none', reasons: [] };

  const danger = DANGER.filter(r => r.pattern.test(cmd)).map(r => r.reason);
  if (danger.length) return { level: 'danger', reasons: danger };

  const caution = CAUTION.filter(r => r.pattern.test(cmd)).map(r => r.reason);
  if (caution.length) return { level: 'caution', reasons: caution };

  return { level: 'safe', reasons: [] };
}
