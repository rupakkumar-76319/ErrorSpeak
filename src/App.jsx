import React, { useState } from 'react';
import Header from './components/Header';
import PresetRibbon from './components/PresetRibbon';
import TerminalInput from './components/TerminalInput';
import TriageCard from './components/TriageCard';
import AIPanel from './components/AIPanel';
import AnswerCheck from './components/AnswerCheck';
import SettingsModal from './components/SettingsModal';
import { parseError, detectEnvironment } from './engine/parser';
import { Terminal, Cpu, Sparkles } from 'lucide-react';

const LLM_STORAGE = 'errorspeak.llm';
const EMPTY_LLM = { model: '', apiKey: '', baseUrl: '' };

function loadLLM() {
  try {
    const saved = localStorage.getItem(LLM_STORAGE);
    if (saved) return { config: { ...EMPTY_LLM, ...JSON.parse(saved) }, remember: true };
    const session = sessionStorage.getItem(LLM_STORAGE);
    return { config: session ? { ...EMPTY_LLM, ...JSON.parse(session) } : EMPTY_LLM, remember: false };
  } catch {
    return { config: EMPTY_LLM, remember: false };
  }
}

function storeLLM(config, remember) {
  try {
    localStorage.removeItem(LLM_STORAGE);
    sessionStorage.removeItem(LLM_STORAGE);
    if (config.model) (remember ? localStorage : sessionStorage).setItem(LLM_STORAGE, JSON.stringify(config));
  } catch {
    // Storage blocked (private mode): the settings live in memory for this tab only
  }
}

export default function App() {
  const [errorInput, setErrorInput] = useState('');
  const [analyzedText, setAnalyzedText] = useState('');
  const [activePresetId, setActivePresetId] = useState(null);
  const [localReport, setLocalReport] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [view, setView] = useState('local');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiStatus, setAiStatus] = useState({ loading: false, error: '' });
  const [{ config: llm, remember }, setLLMState] = useState(loadLLM);
  const [showSettings, setShowSettings] = useState(false);

  const detectedEnv = detectEnvironment(errorInput);

  const runTriage = (text) => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setAiReport(null);
    setAiStatus({ loading: false, error: '' });
    setView('local');
    // Short scan animation; parsing itself takes well under a millisecond
    setTimeout(() => {
      setLocalReport(parseError(text));
      setAnalyzedText(text);
      setIsAnalyzing(false);
    }, 120);
  };

  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setErrorInput(preset.rawError);
    runTriage(preset.rawError);
  };

  const handleClear = () => {
    setErrorInput('');
    setAnalyzedText('');
    setActivePresetId(null);
    setLocalReport(null);
    setAiReport(null);
    setAiStatus({ loading: false, error: '' });
  };

  const handleAskAI = async (redactedText) => {
    setAiStatus({ loading: true, error: '' });
    try {
      const { analyzeWithLLM } = await import('./engine/llm');
      const report = await analyzeWithLLM({ config: llm, redactedText, localReport });
      setAiReport(report);
      setView('ai');
      setAiStatus({ loading: false, error: '' });
    } catch (err) {
      setAiStatus({ loading: false, error: err.message });
    }
  };

  const handleSaveLLM = (config, keep) => {
    storeLLM(config, keep);
    setLLMState({ config, remember: keep });
    setShowSettings(false);
  };

  const shownReport = view === 'ai' && aiReport ? aiReport : localReport;

  return (
    <div className="min-h-screen bg-page text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <Header modelName={llm.model} onOpenSettings={() => setShowSettings(true)} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        <PresetRibbon activePresetId={activePresetId} onSelectPreset={handleSelectPreset} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-start">
          <div className="h-full">
            <TerminalInput
              value={errorInput}
              onChange={(val) => {
                setErrorInput(val);
                setActivePresetId(null);
              }}
              onAnalyze={() => runTriage(errorInput)}
              onClear={handleClear}
              detectedEnv={detectedEnv}
              isAnalyzing={isAnalyzing}
            />
          </div>

          <div className="h-full flex flex-col gap-4">
            {localReport ? (
              <>
                {aiReport && (
                  <div className="flex items-center gap-1 rounded-xl bg-slate-900/80 border border-slate-800 p-1 text-xs font-mono w-fit">
                    <button
                      onClick={() => setView('local')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${view === 'local' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Cpu className="w-3.5 h-3.5" /> Local engine
                    </button>
                    <button
                      onClick={() => setView('ai')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${view === 'ai' ? 'bg-violet-600 text-on-accent' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      <Sparkles className="w-3.5 h-3.5" /> {aiReport.model}
                    </button>
                  </div>
                )}
                <TriageCard key={shownReport.id} report={shownReport} rawText={analyzedText} />
                <AIPanel
                  rawText={analyzedText}
                  localReport={localReport}
                  modelName={llm.model}
                  status={aiStatus}
                  onAsk={handleAskAI}
                  onOpenSettings={() => setShowSettings(true)}
                />
                <AnswerCheck key={analyzedText} rawText={analyzedText} />
              </>
            ) : (
              <div className="h-full min-h-[420px] rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-800/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/20">
                  <Terminal className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-200 font-mono mb-1.5">Paste an error to get started</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-6 font-sans">
                  Pick a sample above or paste a traceback. The local engine explains it offline in plain English; your own LLM is there for the errors it can't handle.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md text-left font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-cyan-400 font-bold mb-1">1. Trace</div>
                    <div className="text-[11px] text-slate-500">Find the failing line</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-emerald-400 font-bold mb-1">2. Explain</div>
                    <div className="text-[11px] text-slate-500">Plain-English cause</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-purple-400 font-bold mb-1">3. Fix safely</div>
                    <div className="text-[11px] text-slate-500">Checked command + patch</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3 text-center text-xs font-mono text-slate-500">
        ErrorSpeak · local-first error triage ·{' '}
        <a href="https://github.com/rupakkumar-76319/ErrorSpeak/blob/main/eval/RESULTS.md" target="_blank" rel="noreferrer" className="text-slate-400 hover:text-cyan-300 underline-offset-2 hover:underline">
          50/52 correct on unseen real GitHub errors
        </a>{' '}
        · built for Devpost Build With AI: Basics
      </footer>

      {showSettings && (
        <SettingsModal config={llm} remember={remember} onSave={handleSaveLLM} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
