import React, { useMemo, useState } from 'react';
import { ClipboardCheck, Copy, CheckCircle2, XCircle, ShieldAlert, Info, Eye, SearchCheck } from 'lucide-react';
import { buildSafePrompt, checkAnswer } from '../engine/answer-check';

const STYLE = {
  danger: { icon: ShieldAlert, row: 'text-rose-200', icon_: 'text-rose-400' },
  warn: { icon: XCircle, row: 'text-amber-200', icon_: 'text-amber-400' },
  info: { icon: Info, row: 'text-slate-300', icon_: 'text-slate-400' },
  ok: { icon: CheckCircle2, row: 'text-slate-300', icon_: 'text-emerald-400' },
};
const KIND = { command: 'Command', package: 'Package', file: 'File', quote: 'Quote' };

export default function AnswerCheck({ rawText }) {
  const { prompt, findings } = useMemo(() => buildSafePrompt(rawText), [rawText]);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const hidden = findings.reduce((n, f) => n + f.count, 0);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShowPrompt(true); // clipboard blocked: show the prompt so it can be copied by hand
    }
  };

  const { counts } = result || {};

  return (
    <div className="rounded-2xl border p-4 font-sans bg-slate-900/70 border-slate-800">
      <div className="text-xs text-slate-300 leading-relaxed">
        <div className="flex items-center gap-1.5 font-mono font-semibold text-cyan-300 mb-0.5">
          <ClipboardCheck className="w-3.5 h-3.5" />
          Using ChatGPT, Gemini or another chat AI? Check its answer
        </div>
        No API key needed. Copy a prompt with your secrets removed, ask any AI, then paste its answer here. ErrorSpeak checks every file, package, command and quote in it against your error.
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-mono">
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${copied ? 'bg-emerald-500 text-ink' : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-200 border border-cyan-800/60'}`}
        >
          {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied!' : '1. Copy safe prompt'}
        </button>
        <span className={`px-2 py-0.5 rounded border ${hidden ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' : 'bg-slate-950/60 border-slate-800 text-slate-400'}`}>
          {hidden ? `${hidden} sensitive item${hidden > 1 ? 's' : ''} removed` : 'No secrets detected'}
        </span>
        <button onClick={() => setShowPrompt((v) => !v)} className="text-cyan-300 hover:text-cyan-200 underline-offset-2 hover:underline flex items-center gap-1">
          <Eye className="w-3 h-3" /> {showPrompt ? 'Hide' : 'Preview'} prompt
        </button>
      </div>

      {showPrompt && (
        <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-code border border-slate-800 p-2.5 text-[11px] text-slate-300 whitespace-pre-wrap">{prompt}</pre>
      )}

      <label htmlFor="ai-answer" className="block mt-3 mb-1 text-[11px] font-mono text-slate-400">2. Paste the AI's answer</label>
      <textarea
        id="ai-answer"
        value={answer}
        onChange={(e) => { setAnswer(e.target.value); setResult(null); }}
        rows={5}
        placeholder="Paste the full reply from ChatGPT, Gemini, Claude or any other AI..."
        className="w-full rounded-lg bg-code border border-slate-800 p-2.5 text-xs font-mono text-slate-200 placeholder:text-slate-500 resize-y focus:border-cyan-700"
      />
      <button
        onClick={() => setResult(checkAnswer(answer, rawText))}
        disabled={!answer.trim()}
        className="mt-2 flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold font-mono bg-cyan-600 hover:bg-cyan-500 text-on-accent disabled:opacity-50"
      >
        <SearchCheck className="w-3.5 h-3.5" /> 3. Check answer
      </button>

      {result && (
        <div className="mt-3 rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5" aria-live="polite">
          {result.items.length === 0 ? (
            <div className="text-xs text-slate-400">No files, packages, commands or quotes found to check in this answer.</div>
          ) : (
            <>
              <div className="text-xs font-mono text-slate-300 mb-2.5">
                {counts.danger > 0 && <span className="text-rose-300 font-semibold">{counts.danger} dangerous · </span>}
                <span className={counts.warn ? 'text-amber-300 font-semibold' : ''}>{counts.warn} to check</span>
                {' · '}
                <span className="text-emerald-300">{counts.ok} confirmed by your error</span>
              </div>
              <ul className="flex flex-col gap-2 text-xs">
                {result.items.map((it, i) => {
                  const s = STYLE[it.status];
                  const Icon = s.icon;
                  return (
                    <li key={i} className={`flex items-start gap-2 ${s.row}`}>
                      <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${s.icon_}`} />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold font-mono text-slate-500 mr-1.5">{KIND[it.kind]}</span>
                        <code className="break-all font-mono">{it.label}</code>
                        <div className="text-slate-400">{it.detail}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <div className="mt-2.5 text-[11px] text-slate-500">These checks confirm what the answer says matches your error. They can't prove the fix is right.</div>
        </div>
      )}
    </div>
  );
}
