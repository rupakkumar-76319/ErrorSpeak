import React from 'react';
import { Sparkles, Terminal } from 'lucide-react';
import { ERROR_PRESETS } from '../engine/presets';

export default function PresetRibbon({ activePresetId, onSelectPreset }) {
  return (
    <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-3 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-300">Quick-Load Demo Presets:</span>
          <span className="hidden sm:inline text-slate-500">(1-click offline triage)</span>
        </div>
        <span className="text-[10px] font-mono text-slate-500">
          5 Scenario Presets
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {ERROR_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                isActive
                  ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-200 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
              }`}
            >
              <Terminal className={`w-3 h-3 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="font-medium">{preset.label}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                {preset.env}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
