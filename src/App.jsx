import React, { useState } from 'react';
import Header from './components/Header';
import PresetRibbon from './components/PresetRibbon';
import TerminalInput from './components/TerminalInput';
import TriageCard from './components/TriageCard';
import { parseError, detectEnvironment } from './engine/parser';
import { ERROR_PRESETS } from './engine/presets';
import { Terminal, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [errorInput, setErrorInput] = useState('');
  const [activePresetId, setActivePresetId] = useState(null);
  const [report, setReport] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-detect environment on keystroke
  const detectedEnv = detectEnvironment(errorInput);

  const handleSelectPreset = (preset) => {
    setActivePresetId(preset.id);
    setErrorInput(preset.rawError);
    setIsAnalyzing(true);
    
    // Quick micro-animation for responsiveness
    setTimeout(() => {
      setReport({
        ...preset.parsed,
        id: preset.id,
        timestamp: new Date().toLocaleTimeString(),
      });
      setIsAnalyzing(false);
    }, 150);
  };

  const handleAnalyze = () => {
    if (!errorInput.trim()) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const parsedReport = parseError(errorInput);
      setReport(parsedReport);
      setIsAnalyzing(false);
    }, 200);
  };

  const handleClear = () => {
    setErrorInput('');
    setActivePresetId(null);
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Top Preset Quick-Loader */}
        <PresetRibbon
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
        />

        {/* Main Workstation Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 items-start">
          {/* Left Panel: Input Terminal */}
          <div className="h-full">
            <TerminalInput
              value={errorInput}
              onChange={(val) => {
                setErrorInput(val);
                setActivePresetId(null);
              }}
              onAnalyze={handleAnalyze}
              onClear={handleClear}
              detectedEnv={detectedEnv}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Right Panel: Triage Report or Standby State */}
          <div className="h-full">
            {report ? (
              <TriageCard report={report} />
            ) : (
              <div className="h-full min-h-[420px] rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-800/80 border border-cyan-800/40 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/20">
                  <Terminal className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-200 font-mono mb-1.5">
                  Triage Remediation Console Ready
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed mb-6 font-sans">
                  Select any preset chip above or paste a terminal traceback to generate plain-language explanations, fault lines, and 1-click shell fixes.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-md text-left font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-cyan-400 font-bold mb-1">1. Trace</div>
                    <div className="text-[11px] text-slate-500">Isolate error stack frames</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-emerald-400 font-bold mb-1">2. Explain</div>
                    <div className="text-[11px] text-slate-500">Human-readable cause</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="text-purple-400 font-bold mb-1">3. Fix</div>
                    <div className="text-[11px] text-slate-500">1-click verified shell fix</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-3 text-center text-xs font-mono text-slate-500">
        ErrorSpeak • Built with AI Agentic Spec-Driven Workflow • Devpost Hackathon 2026
      </footer>
    </div>
  );
}
