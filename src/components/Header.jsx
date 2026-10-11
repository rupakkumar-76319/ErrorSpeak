import React from 'react';
import { Terminal, Cpu, Zap, Github, ShieldCheck } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
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
                v1.0 POC
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Terminal Triage & Stack Trace Auto-Remediation
            </p>
          </div>
        </div>

        {/* System Badges */}
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% CPU Native</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>&lt; 100ms Triage</span>
          </div>

          <a
            href="https://learn-ai-basics.devpost.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-950/40 border border-blue-800/60 text-xs text-blue-300 hover:bg-blue-900/50 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Devpost Challenge</span>
          </a>
        </div>
      </div>
    </header>
  );
}
