import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  Wand2,
  Mic,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  Info,
} from 'lucide-react';
import { PrebuiltVoiceName, VoicePersona } from '../types/tts.ts';
import { VOCAL_BURSTS, BACKCHANNELS, estimateSpeechDuration, countVocalBursts } from '../utils/speech.ts';
import { CURATED_VOICES, SAMPLE_PROMPTS } from '../data/voices.ts';

interface SingleSpeakerStudioProps {
  onGenerate: (text: string, voiceName: PrebuiltVoiceName, stylePrompt: string) => Promise<void>;
  isGenerating: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDownload: () => void;
  hasAudio: boolean;
  customVoices: VoicePersona[];
}

export const SingleSpeakerStudio: React.FC<SingleSpeakerStudioProps> = ({
  onGenerate,
  isGenerating,
  isPlaying,
  onPlayPause,
  onDownload,
  hasAudio,
  customVoices,
}) => {
  const [text, setText] = useState<string>(
    '<breath> Beyond the edge of known space... lies a secret humanity was never meant to uncover. <sigh> They thought we were alone. They were wrong.'
  );
  const [selectedVoice, setSelectedVoice] = useState<PrebuiltVoiceName>('Charon');
  const [stylePrompt, setStylePrompt] = useState<string>(
    'Deep, resonant baritone, cinematic trailer pacing, ominous quiet intensity'
  );
  const [isEnhancing, setIsEnhancing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'bursts' | 'backchannels'>('bursts');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Combine curated voices and user-created custom personas
  const allVoices = [...CURATED_VOICES, ...customVoices];
  const activeVoicePersona = allVoices.find((v) => v.prebuiltVoice === selectedVoice) || allVoices[0];

  const burstCounts = countVocalBursts(text);
  const estimatedSeconds = estimateSpeechDuration(text);

  const insertTagAtCursor = (tag: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((prev) => `${prev} ${tag} `);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const updated = current.substring(0, start) + ` ${tag} ` + current.substring(end);
    setText(updated);

    // Restore cursor position after inserted tag
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
    }, 0);
  };

  const handleEnhanceScript = async () => {
    if (!text.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/tts/enhance-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mode: stylePrompt || 'natural cinematic',
        }),
      });
      const data = await res.json();
      if (data.enhancedText) {
        setText(data.enhancedText);
      }
    } catch (err) {
      console.error('Failed to enhance script:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleApplyPreset = (prompt: typeof SAMPLE_PROMPTS[0]) => {
    setText(prompt.text);
    setSelectedVoice(prompt.voice as PrebuiltVoiceName);
    setStylePrompt(prompt.style);
  };

  const handleVoiceSelect = (persona: VoicePersona) => {
    setSelectedVoice(persona.prebuiltVoice);
    if (persona.defaultStyle) {
      setStylePrompt(persona.defaultStyle);
    }
  };

  return (
    <div className="space-y-4">
      {/* Sample Quick Starters Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Quick Starters:</span>
        </span>
        {SAMPLE_PROMPTS.map((p) => (
          <button
            key={p.title}
            onClick={() => handleApplyPreset(p)}
            className="whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-850 transition-colors"
          >
            {p.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Script Editor with Vocal Burst Toolbar */}
        <div className="lg:col-span-8 space-y-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl">
            {/* Editor Header & Tag Insert Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-1.5 p-0.5 bg-slate-950/80 rounded-lg border border-slate-850">
                <button
                  type="button"
                  onClick={() => setActiveTab('bursts')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'bursts'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Vocal Bursts ({VOCAL_BURSTS.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('backchannels')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    activeTab === 'backchannels'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Backchannels ({BACKCHANNELS.length})
                </button>
              </div>

              {/* AI Script Polish */}
              <button
                type="button"
                onClick={handleEnhanceScript}
                disabled={isEnhancing || !text.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-all disabled:opacity-50 cursor-pointer"
                title="Automatically inject natural human breath & cadence"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'Director Polishing...' : 'Auto-Inject Bursts'}</span>
              </button>
            </div>

            {/* Tag insertion chips */}
            <div className="py-2.5 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-slate-500 font-mono mr-1">CLICK TO INSERT:</span>
              {activeTab === 'bursts'
                ? VOCAL_BURSTS.map((b) => (
                    <button
                      key={b.tag}
                      type="button"
                      onClick={() => insertTagAtCursor(b.tag)}
                      className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-sky-300 border border-slate-700/80 hover:bg-sky-950/40 hover:border-sky-500/60 transition-colors"
                      title={b.desc}
                    >
                      {b.tag}
                    </button>
                  ))
                : BACKCHANNELS.map((bc) => (
                    <button
                      key={bc.tag}
                      type="button"
                      onClick={() => insertTagAtCursor(bc.tag)}
                      className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-emerald-300 border border-slate-700/80 hover:bg-emerald-950/40 hover:border-emerald-500/60 transition-colors"
                      title={bc.desc}
                    >
                      {bc.tag}
                    </button>
                  ))}
            </div>

            {/* Main Textarea */}
            <div className="relative">
              <label htmlFor="script-textarea" className="sr-only">Script Text</label>
              <textarea
                id="script-textarea"
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter or paste your text here. Insert <breath>, <laugh>, or |yeah| for ultra-organic neural delivery..."
                rows={7}
                className="w-full bg-slate-950/60 border border-slate-800/90 rounded-lg p-3.5 text-slate-100 text-sm leading-relaxed placeholder:text-slate-600 focus:outline-none focus:border-sky-500/70 focus:ring-1 focus:ring-sky-500/30 font-sans resize-y"
              />
            </div>

            {/* Editor Stats Footer */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60 mt-1">
              <div className="flex items-center gap-3 font-mono">
                <span>{text.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>·</span>
                <span>{text.length} chars</span>
                <span>·</span>
                <span className="text-sky-400 font-medium">Est. ~{estimatedSeconds}s audio</span>
              </div>
              <div className="flex items-center gap-2">
                {burstCounts.total > 0 && (
                  <span className="text-[11px] text-emerald-400 font-mono">
                    {burstCounts.total} expressive tag{burstCounts.total > 1 ? 's' : ''} active
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setText('')}
                  className="text-slate-500 hover:text-slate-300 text-xs py-0.5 px-1.5 rounded hover:bg-slate-800 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Emotion & Tone Direction */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="voice-direction-input" className="text-slate-300 font-medium flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-sky-400" />
                <span>Director Tone & Emotion Prompt (Gemini Neural Guidance)</span>
              </label>
              <span className="text-slate-500 text-[11px]">Direct voice personality</span>
            </div>
            <input
              id="voice-direction-input"
              type="text"
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              placeholder="e.g. Deep, resonant baritone, cinematic trailer pacing, ominous quiet intensity"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
            />
            {/* Quick style pills */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                'Cinematic trailer gravitas',
                'Fast-paced lively YouTube',
                'Intimate bedtime whisper',
                'Gravelly scarred warrior',
                'Crisp executive keynote',
                'Thoughtful podcast analyst',
              ].map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setStylePrompt(style)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-750 transition-colors"
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Voice Persona Selection & Primary Action */}
        <div className="lg:col-span-4 space-y-3">
          {/* Active Voice Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-sky-500/20">
                  {selectedVoice[0]}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">{activeVoicePersona.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {activeVoicePersona.gender} · {activeVoicePersona.accent}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-700">
                {activeVoicePersona.category}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-850">
              {activeVoicePersona.description}
            </p>

            {/* Voice Palette Grid */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Select Voice Profile:</span>
              <div className="grid grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                {allVoices.map((v) => {
                  const isSelected = selectedVoice === v.prebuiltVoice && v.id === activeVoicePersona.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleVoiceSelect(v)}
                      className={`text-left p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-sky-500/15 border-sky-500 text-white shadow-sm'
                          : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="text-xs font-medium truncate">{v.name.split('·')[0].trim()}</div>
                      <div className="text-[10px] text-slate-500 truncate">{v.category}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Action Button: Synthesize */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onGenerate(text, selectedVoice, stylePrompt)}
                disabled={isGenerating || !text.trim()}
                className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synthesizing Voice...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Generate Speech</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Playback Bar if audio generated */}
            {hasAudio && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={onPlayPause}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Preview</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onDownload}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                  title="Download Master WAV Audio"
                  aria-label="Download WAV"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
