import React, { useState } from 'react';
import { Mic, Waves, Sparkles, Sliders, Users, Info, X } from 'lucide-react';

export type StudioMode = 'single' | 'screenplay' | 'voicelab';

interface HeaderProps {
  currentMode: StudioMode;
  onSelectMode: (mode: StudioMode) => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentMode, onSelectMode, hasApiKey }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-sky-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Waves className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">AuraWave</h1>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                PRO STUDIO
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Next-Gen Neural Speech Synthesizer · 24kHz Studio WAV
            </p>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <nav className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl" aria-label="Studio Mode Tabs">
          <button
            type="button"
            onClick={() => onSelectMode('single')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentMode === 'single'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Single Voice Studio</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('screenplay')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentMode === 'screenplay'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Screenplay & Podcast Lab</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectMode('voicelab')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              currentMode === 'voicelab'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Voice Foundry & Lab</span>
          </button>
        </nav>

        {/* Engine Status & Info Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gemini 3.8 Flash Neural Speech</span>
          </div>

          <button
            type="button"
            onClick={() => setShowInfo(!showInfo)}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Studio Specifications"
            aria-label="Studio Specifications"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info Modal / Overlay */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Why AuraWave Beats The Rest</h3>
                <p className="text-xs text-slate-400">Next-gen neural architecture advantages</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <h4 className="font-semibold text-sky-300 mb-1">1. Organic Vocal Bursts & Backchannels</h4>
                <p className="text-slate-400 leading-relaxed">
                  Unlike conventional robotic TTS that ignores human breath and conversation, AuraWave natively generates authentic vocal bursts like <code className="text-sky-300 font-mono">&lt;laugh&gt;</code>, <code className="text-sky-300 font-mono">&lt;gasp&gt;</code>, <code className="text-sky-300 font-mono">&lt;breath&gt;</code> and dialogue nods like <code className="text-emerald-300 font-mono">|yeah|</code>, <code className="text-emerald-300 font-mono">|mhm|</code>.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <h4 className="font-semibold text-emerald-300 mb-1">2. Native Dual-Speaker Screenplay Mode</h4>
                <p className="text-slate-400 leading-relaxed">
                  Generate true two-person podcast banter, cinematic dialogue, and interview scripts with synchronized character voice assignment in a single pass.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                <h4 className="font-semibold text-indigo-300 mb-1">3. Integrated Studio Audio Mastering Rack</h4>
                <p className="text-slate-400 leading-relaxed">
                  Real-time broadcast low-end warmth (SM7B contouring), high-frequency presence, and acoustic convolution reverb with uncompressed 24kHz WAV export.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowInfo(false)}
                className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-md transition-colors"
              >
                Enter Studio
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
