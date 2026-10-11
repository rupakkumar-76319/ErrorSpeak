import React, { useState } from 'react';
import Header from './components/Header';
import TerminalInput from './components/TerminalInput';

export default function App() {
  const [errorInput, setErrorInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = () => {
    if (!errorInput.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 200);
  };

  const handleClear = () => {
    setErrorInput('');
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Placeholder banner for Slice 1 */}
        <div className="rounded-xl p-4 bg-slate-900/50 border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span className="font-mono text-cyan-400">⚡ ErrorSpeak Console Ready</span>
          <span className="text-slate-500 font-mono">100% CPU Local Sandbox</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
          {/* Left Panel: Input Editor */}
          <TerminalInput
            value={errorInput}
            onChange={setErrorInput}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
            detectedEnv={null}
            isAnalyzing={isAnalyzing}
          />

          {/* Right Panel: Standby HUD */}
          <div className="rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 p-8 flex flex-col items-center justify-center text-center text-slate-500">
            <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-4">
              <span className="font-mono text-lg font-bold">HUD</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-300 font-mono mb-1">
              Triage Remediation Standby
            </h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Paste a terminal error or choose a preset scenario to generate the instant diagnostic breakdown.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
