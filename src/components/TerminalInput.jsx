import React from 'react';
import { Terminal, Play, Trash2, Code2 } from 'lucide-react';

export default function TerminalInput({
  value,
  onChange,
  onAnalyze,
  onClear,
  detectedEnv,
  isAnalyzing,
}) {
  const lineCount = value ? value.split('\n').length : 1;

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onAnalyze();
    }
  };

  return (
    <div className="flex flex-col h-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden backdrop-blur-sm">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600/40" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
          </div>
          <span className="text-xs font-mono text-slate-400 ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-slate-500" />
            stdin • terminal_output.log
          </span>
        </div>

        <div className="flex items-center gap-3">
          {detectedEnv && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-300 flex items-center gap-1">
              <Code2 className="w-3 h-3" />
              {detectedEnv}
            </span>
          )}
          {value && (
            <button
              onClick={onClear}
              className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-slate-800 transition-colors"
              title="Clear Terminal"
              aria-label="Clear input"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="relative flex-1 flex bg-page min-h-[300px]">
        <div aria-hidden="true" className="select-none py-3 px-2 text-right font-mono text-xs text-slate-600 bg-slate-950/40 border-r border-slate-800/40 min-w-[2.5rem]">
          {Array.from({ length: Math.max(lineCount, 12) }).map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Terminal error output"
          placeholder="// Paste terminal error, traceback, or compiler output here...&#10;// Or click any sample preset above to see instant diagnosis."
          className="flex-1 p-3 bg-transparent font-mono text-xs sm:text-sm text-slate-200 placeholder:text-slate-600 leading-6 resize-none focus:outline-none focus:ring-0 selection:bg-cyan-500/30"
          spellCheck={false}
        />
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>{lineCount} lines</span>
          <span>•</span>
          <span>{value.length} chars</span>
        </div>

        <button
          onClick={onAnalyze}
          disabled={!value.trim() || isAnalyzing}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-md ${
            value.trim() && !isAnalyzing
              ? 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-on-accent shadow-blue-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isAnalyzing ? 'Triaging...' : 'Run Triage Engine'}</span>
          <span className="hidden sm:inline text-[10px] opacity-75 font-normal">(Ctrl+↵)</span>
        </button>
      </div>
    </div>
  );
}
