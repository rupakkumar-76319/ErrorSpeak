import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  AlertTriangle,
  Sparkles,
  Code,
  Terminal,
  Layers,
  Zap,
  ShieldAlert,
  ShieldCheck,
  SearchCheck,
  XCircle,
  Cpu,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { lintCommand } from '../engine/safety';
import { groundReport } from '../engine/grounding';

const FIX_KIND = {
  shell: { title: 'Fix command', hint: 'Run this to fix it' },
  code: { title: 'Open the fault line, then apply the patch', hint: 'Code edit' },
  diagnose: { title: 'Diagnostic command', hint: 'Run this to learn more first' },
};

const CONFIDENCE = {
  high: 'text-emerald-300 bg-emerald-950/60 border-emerald-800',
  medium: 'text-amber-300 bg-amber-950/60 border-amber-800',
  low: 'text-rose-300 bg-rose-950/60 border-rose-800',
};

export default function TriageCard({ report, rawText }) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('eli5'); // 'eli5' | 'tldr'

  const safety = useMemo(() => lintCommand(report?.fixCommand), [report]);
  const grounding = useMemo(() => groundReport(report, rawText), [report, rawText]);

  if (!report) return null;

  const kind = FIX_KIND[report.fixKind] || FIX_KIND.diagnose;
  const isDanger = safety.level === 'danger';

  const handleCopy = () => {
    navigator.clipboard.writeText(report.fixCommand);
    setCopied(true);
    if (!isDanger) {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#38bdf8', '#34d399', '#a78bfa'] });
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const getSeverityColor = (sev) => {
    if (sev >= 8) return 'text-rose-400 bg-rose-950/60 border-rose-800';
    if (sev >= 6) return 'text-amber-400 bg-amber-950/60 border-amber-800';
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
  };

  const getEnvBadgeColor = (env) => {
    switch (env) {
      case 'Python':
        return 'bg-yellow-950/70 text-yellow-300 border-yellow-700/60';
      case 'Node.js':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-700/60';
      case 'Git':
        return 'bg-orange-950/70 text-orange-300 border-orange-700/60';
      case 'Docker':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-700/60';
      case 'PowerShell / Shell':
        return 'bg-blue-950/70 text-blue-300 border-blue-700/60';
      default:
        return 'bg-purple-950/70 text-purple-300 border-purple-700/60';
    }
  };

  const boxStyle = isDanger
    ? 'border-rose-700/70 shadow-rose-950/30'
    : safety.level === 'caution'
      ? 'border-amber-700/60 shadow-amber-950/20'
      : 'border-emerald-900/50 shadow-emerald-950/20';

  return (
    <div className="flex flex-col h-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm">
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${getEnvBadgeColor(report.environment)}`}>
            {report.environment}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
            {report.errorType}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400">Severity:</span>
            <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getSeverityColor(report.severity)}`}>
              {report.severity}/10
            </span>
          </div>

          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-[11px] font-mono">
            {[['eli5', 'Plain English'], ['tldr', 'TL;DR']].map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                aria-pressed={viewMode === mode}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  viewMode === mode ? 'bg-cyan-500 text-ink font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-2 bg-slate-950/50 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-[11px] font-mono">
        {report.source === 'ai' ? (
          <span className="px-2 py-0.5 rounded border bg-violet-950/60 border-violet-800 text-violet-300 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {report.provider} · {report.model}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded border bg-slate-900 border-slate-700 text-slate-300 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-emerald-400" /> Local engine · offline
          </span>
        )}
        {report.source !== 'ai' && (
          <span className={`px-2 py-0.5 rounded border ${CONFIDENCE[report.confidence] || CONFIDENCE.medium}`}>
            {report.confidence} confidence
          </span>
        )}
        {grounding.total > 0 && (
          <span
            className={`px-2 py-0.5 rounded border flex items-center gap-1 ${
              grounding.verified === grounding.total
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/60 border-amber-800 text-amber-300'
            }`}
          >
            <SearchCheck className="w-3 h-3" /> {grounding.verified}/{grounding.total} claims found in your trace
          </span>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[640px]">
        <div className="rounded-xl bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-800/40 p-4">
          <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-mono text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>{viewMode === 'eli5' ? 'What happened:' : 'Root cause:'}</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {viewMode === 'eli5' ? report.plainExplanation : report.rootCause}
          </p>
        </div>

        {report.location && (
          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5 shrink-0">
                <Code className="w-3.5 h-3.5 text-rose-400" />
                <span>Where it broke:</span>
              </span>
              <span className="text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60 truncate">
                {report.location}
              </span>
            </div>

            {report.offendingCode && (
              <div className="bg-code rounded-lg p-2.5 border border-rose-900/30 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre">
                <span className="text-rose-500 select-none mr-2">▶</span>
                {report.offendingCode}
              </div>
            )}
          </div>
        )}

        {report.fixCommand ? (
          <div className={`rounded-xl bg-gradient-to-b from-slate-950 to-code border p-4 shadow-lg ${boxStyle}`}>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
                <Terminal className="w-4 h-4" />
                <span>{kind.title}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">{kind.hint}</span>
            </div>

            <div className="flex items-center justify-between gap-3 bg-code rounded-lg px-3.5 py-3 border border-emerald-500/30">
              <div className="font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto select-all">
                <span className="text-emerald-500 select-none mr-2">$</span>
                {report.fixCommand}
              </div>

              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all shrink-0 ${
                  copied
                    ? 'bg-emerald-500 text-ink font-bold'
                    : isDanger
                      ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/60'
                      : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60'
                }`}
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : isDanger ? 'Copy anyway' : 'Copy'}</span>
              </button>
            </div>

            {safety.level !== 'none' && (
              <div
                className={`mt-3 text-xs font-sans flex items-start gap-2 rounded-lg p-2.5 border ${
                  isDanger
                    ? 'bg-rose-950/40 border-rose-800/70 text-rose-200'
                    : safety.level === 'caution'
                      ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                      : 'bg-emerald-950/20 border-emerald-900/50 text-emerald-300'
                }`}
              >
                {safety.level === 'safe' ? (
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-semibold font-mono">
                    {isDanger ? 'Destructive command: ' : safety.level === 'caution' ? 'Check before running: ' : 'Safety check passed: '}
                  </span>
                  {safety.reasons.length ? safety.reasons.join(' ') : 'nothing destructive in this command.'}
                </div>
              </div>
            )}

            <div className="mt-3 text-xs text-slate-400 font-sans flex items-start gap-2 bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/60">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-300 font-mono">Why this works: </span>
                {report.whyItWorks}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl bg-slate-950/60 border border-dashed border-slate-700 p-4 text-xs text-slate-400 font-sans flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <b>No reliable fix from the local rules. Ask your LLM below rather than guessing.</b>
          </div>
        )}

        {report.fixDiff && (
          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Suggested patch:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2 text-rose-300 overflow-x-auto">
                <div className="text-[10px] text-rose-400 uppercase font-bold mb-1">- Before</div>
                <pre className="whitespace-pre-wrap">{report.fixDiff.before}</pre>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2 text-emerald-300 overflow-x-auto">
                <div className="text-[10px] text-emerald-400 uppercase font-bold mb-1">+ After</div>
                <pre className="whitespace-pre-wrap">{report.fixDiff.after}</pre>
              </div>
            </div>
          </div>
        )}

        {grounding.total > 0 && (
          <details className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 group" open={grounding.verified < grounding.total}>
            <summary className="cursor-pointer text-xs font-mono text-slate-400 flex items-center gap-1.5 list-none">
              <SearchCheck className="w-3.5 h-3.5 text-cyan-400" />
              Evidence check: every claim is matched against your trace
            </summary>
            <ul className="mt-2.5 flex flex-col gap-1.5 text-xs font-sans">
              {grounding.checks.map((c, i) => (
                <li key={i} className={`flex items-start gap-2 ${c.ok ? 'text-slate-300' : 'text-amber-300'}`}>
                  {c.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <span className="break-all">{c.label}{c.ok ? '' : ' (not found, treat with care)'}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
