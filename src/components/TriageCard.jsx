import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Copy, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  Code, 
  Terminal, 
  Layers,
  BookOpen,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function TriageCard({ report }) {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState('eli5'); // 'eli5' | 'tldr'

  if (!report) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(report.fixCommand);
    setCopied(true);
    
    // Trigger celebratory confetti for solving the bug!
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#38bdf8', '#34d399', '#a78bfa']
    });

    setTimeout(() => {
      setCopied(false);
    }, 2500);
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

  return (
    <div className="flex flex-col h-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm">
      {/* Triage Header */}
      <div className="p-4 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-lg border ${getEnvBadgeColor(report.environment)}`}>
            {report.environment}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white font-mono flex items-center gap-2">
            {report.errorType}
          </h2>
        </div>

        {/* Severity Gauge & Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400">Severity:</span>
            <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${getSeverityColor(report.severity)}`}>
              {report.severity}/10
            </span>
          </div>

          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-[11px] font-mono">
            <button
              onClick={() => setViewMode('eli5')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                viewMode === 'eli5'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Plain English
            </button>
            <button
              onClick={() => setViewMode('tldr')}
              className={`px-2 py-0.5 rounded-md transition-all ${
                viewMode === 'tldr'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              TL;DR
            </button>
          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto max-h-[580px]">
        {/* 1. Plain English Translation */}
        <div className="rounded-xl bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-800/40 p-4">
          <div className="flex items-center gap-2 mb-1.5 text-cyan-400 font-mono text-xs font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>{viewMode === 'eli5' ? 'Plain-English Diagnosis:' : 'Root Cause Summary:'}</span>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed font-sans">
            {viewMode === 'eli5' ? report.plainExplanation : report.rootCause}
          </p>
        </div>

        {/* 2. Location & Fault Line Pinpoint */}
        {report.location && (
          <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-rose-400" />
                <span>Fault Line Location:</span>
              </span>
              <span className="text-slate-300 font-semibold px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">
                {report.location}
              </span>
            </div>

            {report.offendingCode && (
              <div className="bg-[#050811] rounded-lg p-2.5 border border-rose-900/30 font-mono text-xs text-rose-300 overflow-x-auto">
                <span className="text-rose-500 select-none mr-2">▶</span>
                {report.offendingCode}
              </div>
            )}
          </div>
        )}

        {/* 3. Remediation Action Terminal Box */}
        <div className="rounded-xl bg-gradient-to-b from-slate-950 to-[#070D18] border border-emerald-900/50 p-4 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 font-semibold">
              <Terminal className="w-4 h-4" />
              <span>Verified Remediation Fix</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">1-Click Shell Fix</span>
          </div>

          <div className="flex items-center justify-between gap-3 bg-[#03060E] rounded-lg px-3.5 py-3 border border-emerald-500/30 group">
            <div className="font-mono text-xs sm:text-sm text-emerald-300 overflow-x-auto select-all">
              <span className="text-emerald-500 select-none mr-2">$</span>
              {report.fixCommand}
            </div>

            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-slate-950 font-bold'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Fix</span>
                </>
              )}
            </button>
          </div>

          {/* Why This Fix Works */}
          <div className="mt-3 text-xs text-slate-400 font-sans flex items-start gap-2 bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/60">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-300 font-mono">Why this works: </span>
              {report.whyItWorks}
            </div>
          </div>
        </div>

        {/* 4. Code Diff (Before / After) if present */}
        {report.fixDiff && (
          <div className="rounded-xl bg-slate-950/70 border border-slate-800/80 p-3.5 flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Recommended Code Patch (Diff Preview):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="bg-rose-950/20 border border-rose-900/40 rounded-lg p-2 text-rose-300 overflow-x-auto">
                <div className="text-[10px] text-rose-400 uppercase font-bold mb-1">- Before</div>
                <pre className="whitespace-pre-wrap">{report.fixDiff.before}</pre>
              </div>
              <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-lg p-2 text-emerald-300 overflow-x-auto">
                <div className="text-[10px] text-emerald-400 uppercase font-bold mb-1">+ After (Fixed)</div>
                <pre className="whitespace-pre-wrap">{report.fixDiff.after}</pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
