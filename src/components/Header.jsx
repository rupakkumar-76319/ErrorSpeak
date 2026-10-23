import React, { useState } from 'react';
import { Terminal, Cpu, Sparkles, Github, Sun, Moon } from 'lucide-react';

function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('errorspeak.theme', next); } catch {}
    setTheme(next);
  };
  return [theme, toggle];
}

export default function Header({ modelName, onOpenSettings }) {
  const [theme, toggleTheme] = useTheme();

  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-mono">
                Error<span className="text-cyan-400">Speak</span>
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300">
                POC
              </span>
            </div>
            <p className="text-xs text-slate-400">Terminal errors, explained in plain English, fixed safely</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Local-first · works offline</span>
          </div>

          <button
            onClick={onOpenSettings}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono transition-colors ${
              modelName
                ? 'bg-violet-950/50 border-violet-700/70 text-violet-200 hover:bg-violet-900/50'
                : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            <span>{modelName ? `LLM: ${modelName}` : 'Connect Any LLM'}</span>
          </button>

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
            className="flex items-center justify-center w-8 h-7 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 hover:bg-slate-700/80 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          <a
            href="https://github.com/rupakkumar-76319/ErrorSpeak"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 hover:bg-slate-700/80 transition-colors"
          >
            <Github className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Source</span>
          </a>
        </div>
      </div>
    </header>
  );
}
