// Shared contract for every AI provider: the instructions, the JSON shape we ask for,
// and the conversion into the TriageReport the UI renders.
import { z } from 'zod';

export const TriageSchema = z.object({
  environment: z.string(),
  errorType: z.string(),
  severity: z.number(),
  location: z.string(),
  offendingCode: z.string(),
  plainExplanation: z.string(),
  rootCause: z.string(),
  fixKind: z.enum(['shell', 'code', 'diagnose']),
  fixCommand: z.string(),
  whyItWorks: z.string(),
  fixDiffBefore: z.string(),
  fixDiffAfter: z.string(),
  evidence: z.array(z.string()),
});

export const SYSTEM_PROMPT = `You are the triage engine inside ErrorSpeak, a tool that explains terminal errors to beginner and junior developers.

You receive a terminal error or stack trace. Secrets and user names in it were replaced with placeholders like <API_KEY> or <USER> before it reached you; leave the placeholders as they are.

Return one triage report:
- environment: the runtime or tool (e.g. "Python", "Node.js", "Git", "Docker", "Rust", "Java", "PowerShell / Shell").
- errorType: the error class or code exactly as the trace names it.
- severity: 1 (cosmetic) to 10 (data loss or production down).
- location: "file:line" copied from the trace. If the trace names no file, describe where it happened in a few words without inventing a file name.
- offendingCode: the failing source line if the trace shows it, copied exactly; otherwise an empty string.
- plainExplanation: two or three sentences a beginner understands. No jargon without a short explanation.
- rootCause: one sentence for an experienced developer.
- fixKind: "shell" if a command actually fixes it, "code" if the fix is an edit to source (then fixCommand opens the file at the line, e.g. code -g path:line), "diagnose" if more information is needed first.
- fixCommand: a single command line. Prefer the least destructive option that works. Never suggest rm -rf, git reset --hard, force pushes or piping downloads into a shell unless nothing else can work, and say why in whyItWorks.
- whyItWorks: what the command or edit changes and why that removes the error.
- fixDiffBefore / fixDiffAfter: the code before and after the fix for "code" fixes; empty strings otherwise.
- evidence: 1 to 4 short lines copied verbatim from the trace that support the diagnosis. These are checked character for character, so copy them exactly.

Only state what the trace supports. When the trace is ambiguous, say what is uncertain in plainExplanation and use fixKind "diagnose".`;

// Providers without schema enforcement get the field list spelled out
export const JSON_INSTRUCTIONS = `

Respond with only a JSON object with exactly these keys: environment (string), errorType (string), severity (number), location (string), offendingCode (string), plainExplanation (string), rootCause (string), fixKind ("shell" | "code" | "diagnose"), fixCommand (string), whyItWorks (string), fixDiffBefore (string), fixDiffAfter (string), evidence (array of strings). No markdown fences, no extra text.`;

export function buildUserMessage(redactedText, localReport) {
  const hint = localReport
    ? `\n\nThe local rule-based parser guessed: environment=${localReport.environment}, errorType=${localReport.errorType}, location=${localReport.location}. Treat this as a hint only; correct it if the trace disagrees.`
    : '';
  return `<trace>\n${redactedText}\n</trace>${hint}`;
}

export function toReport(r, { provider, model }) {
  return {
    id: 'ai-' + Date.now(),
    source: 'ai',
    provider,
    model,
    confidence: 'high',
    environment: r.environment,
    errorType: r.errorType,
    severity: Math.min(10, Math.max(1, Math.round(Number(r.severity) || 5))),
    location: r.location,
    offendingCode: r.offendingCode,
    plainExplanation: r.plainExplanation,
    rootCause: r.rootCause,
    fixKind: r.fixKind,
    fixCommand: r.fixCommand,
    whyItWorks: r.whyItWorks,
    fixDiff: r.fixDiffBefore || r.fixDiffAfter ? { before: r.fixDiffBefore, after: r.fixDiffAfter } : null,
    evidence: r.evidence,
    timestamp: new Date().toLocaleTimeString(),
  };
}
