import React from 'react';
import { Sliders, RotateCcw, Volume2, Wind, Sparkles, Gauge } from 'lucide-react';
import { AudioEffectsConfig } from '../types/tts.ts';

interface AudioEffectsRackProps {
  effects: AudioEffectsConfig;
  onChange: (effects: AudioEffectsConfig) => void;
}

export const AudioEffectsRack: React.FC<AudioEffectsRackProps> = ({ effects, onChange }) => {
  const handleReset = () => {
    onChange({
      speed: 1.0,
      pitch: 0,
      bassBoost: 0,
      presence: 0,
      reverbWet: 0.05,
      volume: 1.0,
    });
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-200">Studio Mastering & Effects Rack</h3>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 px-2 rounded hover:bg-slate-800"
          title="Reset to neutral mastering"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Rack</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Speed / Tempo */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-sky-400" />
              <span>Speed / Tempo</span>
            </span>
            <span className="font-mono text-sky-300 tabular-nums">{effects.speed.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.75"
            step="0.05"
            value={effects.speed}
            onChange={(e) => onChange({ ...effects, speed: parseFloat(e.target.value) })}
            className="w-full accent-sky-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            aria-label="Playback Speed"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <button
              onClick={() => onChange({ ...effects, speed: 0.85 })}
              className="hover:text-slate-300"
            >
              0.85x
            </button>
            <button
              onClick={() => onChange({ ...effects, speed: 1.0 })}
              className="hover:text-slate-300"
            >
              1.0x
            </button>
            <button
              onClick={() => onChange({ ...effects, speed: 1.25 })}
              className="hover:text-slate-300"
            >
              1.25x
            </button>
          </div>
        </div>

        {/* Bass Warmth */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Wind className="w-3 h-3 text-amber-400" />
              <span>Warmth (SM7B Lows)</span>
            </span>
            <span className="font-mono text-amber-300 tabular-nums">+{effects.bassBoost.toFixed(1)} dB</span>
          </div>
          <input
            type="range"
            min="0"
            max="8"
            step="0.5"
            value={effects.bassBoost}
            onChange={(e) => onChange({ ...effects, bassBoost: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            aria-label="Bass Warmth EQ"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Flat</span>
            <span>Radio Broadcast Warmth</span>
          </div>
        </div>

        {/* Presence / Air */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Presence & Air</span>
            </span>
            <span className="font-mono text-emerald-300 tabular-nums">+{effects.presence.toFixed(1)} dB</span>
          </div>
          <input
            type="range"
            min="0"
            max="8"
            step="0.5"
            value={effects.presence}
            onChange={(e) => onChange({ ...effects, presence: parseFloat(e.target.value) })}
            className="w-full accent-emerald-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            aria-label="High presence EQ"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Neutral</span>
            <span>Crisp Articulation</span>
          </div>
        </div>

        {/* Studio Reverb */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <Volume2 className="w-3 h-3 text-indigo-400" />
              <span>Studio Reverb</span>
            </span>
            <span className="font-mono text-indigo-300 tabular-nums">
              {(effects.reverbWet * 100).toFixed(0)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.02"
            value={effects.reverbWet}
            onChange={(e) => onChange({ ...effects, reverbWet: parseFloat(e.target.value) })}
            className="w-full accent-indigo-400 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            aria-label="Studio Reverb"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Dry Booth</span>
            <span>Scored Hall</span>
          </div>
        </div>
      </div>
    </div>
  );
};
