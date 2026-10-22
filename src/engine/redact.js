// Strips secrets and personal identifiers from a trace before it can leave the browser.
// Runs on every LLM request, and the user sees exactly what will be sent.

const RULES = [
  { label: 'Private key block', pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, replace: '<PRIVATE_KEY>' },
  { label: 'Anthropic key', pattern: /sk-ant-[A-Za-z0-9_\-]{10,}/g, replace: '<API_KEY>' },
  { label: 'OpenAI-style key', pattern: /\bsk-[A-Za-z0-9_\-]{20,}/g, replace: '<API_KEY>' },
  { label: 'GitHub token', pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}/g, replace: '<GITHUB_TOKEN>' },
  { label: 'AWS access key', pattern: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, replace: '<AWS_KEY>' },
  { label: 'Google API key', pattern: /\bAIza[0-9A-Za-z_\-]{35}\b/g, replace: '<API_KEY>' },
  { label: 'Slack token', pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}/g, replace: '<SLACK_TOKEN>' },
  { label: 'JWT', pattern: /\beyJ[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}\.[A-Za-z0-9_\-]{8,}/g, replace: '<JWT>' },
  { label: 'Bearer token', pattern: /(Bearer\s+)[A-Za-z0-9._\-~+/]{12,}=*/gi, replace: '$1<TOKEN>' },
  { label: 'Connection string password', pattern: /(\b[a-z][a-z0-9+.\-]*:\/\/[^\s:/@]+:)[^\s@/]+(@)/gi, replace: '$1<PASSWORD>$2' },
  { label: 'Secret assignment', pattern: /(\b(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret)\b\s*[=:]\s*["']?)[^\s"',;]{4,}/gi, replace: '$1<REDACTED>' },
  { label: 'Email address', pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g, replace: '<EMAIL>' },
  { label: 'Windows user folder', pattern: /([A-Za-z]:[\\/]{1,2}Users[\\/]{1,2})(?!<USER>)[^\\/\s"'<>]+/gi, replace: '$1<USER>' },
  { label: 'Home folder', pattern: /(\/(?:home|Users)\/)(?!<USER>)[^/\s"'<>]+/g, replace: '$1<USER>' },
];

export function redactSecrets(text) {
  if (!text) return { text: '', findings: [] };

  let out = text;
  const findings = [];
  for (const rule of RULES) {
    const matches = out.match(rule.pattern);
    if (matches && matches.length) {
      findings.push({ label: rule.label, count: matches.length });
      out = out.replace(rule.pattern, rule.replace);
    }
  }
  return { text: out, findings };
}
