import React, { useMemo, useState } from 'react';
import { Sparkles, EyeOff, Eye, Loader2, AlertTriangle, KeyRound } from 'lucide-react';
import { redactSecrets } from '../engine/redact';

export default function AIPanel({ rawText, localReport, modelName, status, onAsk, onOpenSettings }) {
  const [showPreview, setShowPreview] = useState(false);
  const { text: redacted, findings } = useMemo(() => redactSecrets(rawText), [rawText]);
  const lowConfidence = localReport?.confidence === 'low';
  const redactedCount = findings.reduce((n, f) => n + f.count, 0);

  return (
    <div className={`rounded-2xl border p-4 font-sans ${lowConfidence ? 'bg-violet-950/30 border-violet-700/60' : 'bg-slate-900/70 border-slate-800'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-300 leading-relaxed max-w-md">
          <div className="flex items-center gap-1.5 font-mono font-semibold text-violet-300 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            {lowConfidence ? 'The local engine has no rule for this error' : 'Want a second opinion?'}
          </div>
          {lowConfidence
            ? 'Ask your connected LLM for a diagnosis. Its answer is checked against your trace before you see it.'
            : 'Ask your connected LLM to review this diagnosis. Its claims are checked against your trace.'}
        </div>

        {modelName ? (
          <button
            onClick={() => onAsk(redacted)}
            disabled={status.loading}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold font-mono bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-60"
          >
            {status.loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {status.loading ? 'Asking...' : `Ask ${modelName}`}
          </button>
        ) : (
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <KeyRound className="w-3.5 h-3.5" /> Connect an LLM to enable
          </button>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono">
        <span className={`px-2 py-0.5 rounded border ${redactedCount ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
          <EyeOff className="w-3 h-3 inline mr-1" />
          {redactedCount ? `${redactedCount} sensitive item${redactedCount > 1 ? 's' : ''} hidden before sending` : 'No secrets detected'}
        </span>
        {findings.map((f) => (
          <span key={f.label} className="px-2 py-0.5 rounded bg-slate-950/60 border border-slate-800 text-slate-400">
            {f.label} ×{f.count}
          </span>
        ))}
        <button onClick={() => setShowPreview((v) => !v)} className="text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline flex items-center gap-1">
          <Eye className="w-3 h-3" /> {showPreview ? 'Hide' : 'Preview'} what is sent
        </button>
      </div>

      {showPreview && (
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-[#050811] border border-slate-800 p-2.5 text-[11px] text-slate-300 whitespace-pre-wrap">{redacted}</pre>
      )}

      {status.error && (
        <div className="mt-3 flex items-start gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-900/60 rounded-lg p-2.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {status.error}
        </div>
      )}
    </div>
  );
}
