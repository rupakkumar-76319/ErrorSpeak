import React, { useEffect, useState } from 'react';
import { KeyRound, X, ShieldCheck, Trash2, ChevronRight } from 'lucide-react';
import { PROVIDERS, detectProvider } from '../engine/providers';

export default function SettingsModal({ config, remember, onSave, onClose }) {
  const [model, setModel] = useState(config.model);
  const [apiKey, setApiKey] = useState(config.apiKey);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [showAdvanced, setShowAdvanced] = useState(!!config.baseUrl);
  const [keep, setKeep] = useState(remember);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const provider = detectProvider({ apiKey, baseUrl });
  const canSave = model.trim() && provider && (apiKey || provider === 'custom');

  const inputClass =
    'w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-violet-500';

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-5 font-sans"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="LLM settings"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-violet-400" /> Connect any LLM (optional)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mb-4">
          The local engine works without this. Connect the model you already use to get a second opinion on errors the local rules don't cover.
        </p>

        <label className="block text-[11px] font-mono text-slate-400 mb-1" htmlFor="llm-model">Model name</label>
        <input
          id="llm-model"
          type="text"
          autoComplete="off"
          spellCheck={false}
          value={model}
          onChange={(e) => setModel(e.target.value.trim())}
          placeholder={provider ? PROVIDERS[provider].example : 'e.g. claude-opus-5'}
          className={inputClass}
        />

        <label className="block text-[11px] font-mono text-slate-400 mb-1 mt-3" htmlFor="llm-key">
          API key{provider === 'custom' ? ' (optional for local servers)' : ''}
        </label>
        <input
          id="llm-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value.trim())}
          placeholder="sk-ant-...  sk-...  AIza...  sk-or-...  gsk_..."
          className={inputClass}
        />

        <div className="mt-2 text-[11px] font-mono min-h-[1rem]">
          {provider ? (
            <span className="text-emerald-300">Provider: {PROVIDERS[provider].label}</span>
          ) : apiKey ? (
            <span className="text-amber-300">Key format not recognized. Set a base URL under Advanced.</span>
          ) : (
            <span className="text-slate-500">Works with Anthropic, OpenAI, Gemini, OpenRouter, Groq, or any OpenAI-compatible server.</span>
          )}
        </div>

        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="mt-3 flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-slate-200"
        >
          <ChevronRight className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} /> Advanced
        </button>
        {showAdvanced && (
          <div className="mt-2">
            <label className="block text-[11px] font-mono text-slate-400 mb-1" htmlFor="llm-base">
              Base URL (OpenAI-compatible, e.g. http://localhost:11434/v1 for Ollama)
            </label>
            <input
              id="llm-base"
              type="url"
              autoComplete="off"
              spellCheck={false}
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value.trim())}
              placeholder="https://.../v1"
              className={inputClass}
            />
          </div>
        )}

        <label className="flex items-center gap-2 mt-4 text-xs text-slate-300 cursor-pointer">
          <input type="checkbox" checked={keep} onChange={(e) => setKeep(e.target.checked)} className="accent-violet-500" />
          Remember on this device (otherwise cleared when the tab closes)
        </label>

        <div className="mt-4 rounded-lg bg-slate-950/70 border border-slate-800 p-3 text-[11px] text-slate-400 leading-relaxed flex gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Your key stays in this browser and is sent only to the provider you connect. ErrorSpeak has no server.
            Before anything is sent, secrets, emails and user names in your trace are replaced with placeholders, and you can preview exactly what goes out.
          </span>
        </div>

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={() => onSave({ model: '', apiKey: '', baseUrl: '' }, false)}
            className="flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-rose-400"
          >
            <Trash2 className="w-3.5 h-3.5" /> Disconnect
          </button>
          <button
            onClick={() => onSave({ model, apiKey, baseUrl }, keep)}
            disabled={!canSave}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold font-mono bg-violet-600 hover:bg-violet-500 text-on-accent disabled:bg-slate-800 disabled:text-slate-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
