import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  ArrowUpDown,
  Play,
  Pause,
  Download,
  Mic,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { DialogueLine, PrebuiltVoiceName } from '../types/tts.ts';
import { SCREENPLAY_PRESETS, CURATED_VOICES } from '../data/voices.ts';
import { VOCAL_BURSTS, BACKCHANNELS } from '../utils/speech.ts';

interface ScreenplayStudioProps {
  onSynthesizeScreenplay: (lines: DialogueLine[]) => Promise<void>;
  isGenerating: boolean;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDownload: () => void;
  hasAudio: boolean;
  activeLineIndex?: number;
}

export const ScreenplayStudio: React.FC<ScreenplayStudioProps> = ({
  onSynthesizeScreenplay,
  isGenerating,
  isPlaying,
  onPlayPause,
  onDownload,
  hasAudio,
  activeLineIndex = -1,
}) => {
  const [lines, setLines] = useState<DialogueLine[]>(SCREENPLAY_PRESETS[0].lines);
  const [speakerAName, setSpeakerAName] = useState<string>('Alex');
  const [speakerBName, setSpeakerBName] = useState<string>('Jordan');
  const [speakerAVoice, setSpeakerAVoice] = useState<PrebuiltVoiceName>('Puck');
  const [speakerBVoice, setSpeakerBVoice] = useState<PrebuiltVoiceName>('Kore');

  const handleAddLine = (speaker: string, voice: PrebuiltVoiceName) => {
    const newLine: DialogueLine = {
      id: `line-${Date.now()}`,
      speaker,
      voiceName: voice,
      text: '',
      stylePrompt: 'Natural conversational cadence',
      emotion: 'Neutral',
    };
    setLines([...lines, newLine]);
  };

  const handleUpdateLine = (id: string, updates: Partial<DialogueLine>) => {
    setLines(lines.map((l) => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleDeleteLine = (id: string) => {
    if (lines.length <= 2) return; // Keep at least 2 lines
    setLines(lines.filter((l) => l.id !== id));
  };

  const handleApplyPreset = (preset: typeof SCREENPLAY_PRESETS[0]) => {
    setLines(preset.lines);
    const speakers = Array.from(new Set(preset.lines.map((l) => l.speaker)));
    if (speakers[0]) setSpeakerAName(speakers[0]);
    if (speakers[1]) setSpeakerBName(speakers[1]);
  };

  const insertTagIntoLine = (lineId: string, tag: string) => {
    setLines(
      lines.map((l) => (l.id === lineId ? { ...l, text: `${l.text} ${tag} ` } : l))
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Screenplay Presets & Cast Setup */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">Dual-Speaker Screenplay & Podcast Lab</h3>
              <p className="text-xs text-slate-400">
                Direct two AI voice actors with multi-speaker neural backchannels and vocal bursts.
              </p>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Presets:</span>
            </span>
            {SCREENPLAY_PRESETS.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/80 transition-colors"
              >
                {preset.title}
              </button>
            ))}
          </div>
        </div>

        {/* Cast Configuration Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Speaker A */}
          <div className="rounded-lg border border-sky-500/30 bg-sky-950/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-300">Cast Member 1</span>
              <span className="text-[10px] font-mono text-sky-400">Speaker A</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Character Name</label>
                <input
                  type="text"
                  value={speakerAName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setSpeakerAName(newName);
                    setLines(lines.map((l) => (l.speaker === speakerAName ? { ...l, speaker: newName } : l)));
                  }}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
                  placeholder="e.g. Alex"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Voice Actor</label>
                <select
                  value={speakerAVoice}
                  onChange={(e) => {
                    const v = e.target.value as PrebuiltVoiceName;
                    setSpeakerAVoice(v);
                    setLines(lines.map((l) => (l.speaker === speakerAName ? { ...l, voiceName: v } : l)));
                  }}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Puck">Puck (Energetic Male)</option>
                  <option value="Charon">Charon (Deep Baritone)</option>
                  <option value="Fenrir">Fenrir (Gravelly Textures)</option>
                  <option value="Kore">Kore (Articulate Female)</option>
                  <option value="Zephyr">Zephyr (Gentle Female)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Speaker B */}
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300">Cast Member 2</span>
              <span className="text-[10px] font-mono text-emerald-400">Speaker B</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Character Name</label>
                <input
                  type="text"
                  value={speakerBName}
                  onChange={(e) => {
                    const newName = e.target.value;
                    setSpeakerBName(newName);
                    setLines(lines.map((l) => (l.speaker === speakerBName ? { ...l, speaker: newName } : l)));
                  }}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
                  placeholder="e.g. Jordan"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Voice Actor</label>
                <select
                  value={speakerBVoice}
                  onChange={(e) => {
                    const v = e.target.value as PrebuiltVoiceName;
                    setSpeakerBVoice(v);
                    setLines(lines.map((l) => (l.speaker === speakerBName ? { ...l, voiceName: v } : l)));
                  }}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Kore">Kore (Articulate Female)</option>
                  <option value="Zephyr">Zephyr (Gentle Female)</option>
                  <option value="Puck">Puck (Energetic Male)</option>
                  <option value="Charon">Charon (Deep Baritone)</option>
                  <option value="Fenrir">Fenrir (Gravelly Textures)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Screenplay Dialogue Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
            <span>Dialogue Timeline ({lines.length} turns)</span>
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddLine(speakerAName, speakerAVoice)}
              className="px-2.5 py-1 text-xs rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 hover:bg-sky-500/30 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>+ {speakerAName}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddLine(speakerBName, speakerBVoice)}
              className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>+ {speakerBName}</span>
            </button>
          </div>
        </div>

        {/* Turn Cards */}
        <div className="space-y-2.5">
          {lines.map((line, index) => {
            const isSpeakerA = line.speaker === speakerAName;
            const isSpeakingNow = activeLineIndex === index;

            return (
              <div
                key={line.id}
                className={`rounded-xl border p-3.5 transition-all ${
                  isSpeakingNow
                    ? 'border-sky-400 bg-sky-950/40 shadow-lg shadow-sky-500/10'
                    : isSpeakerA
                    ? 'border-slate-800 bg-slate-900/90'
                    : 'border-slate-800/90 bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        isSpeakerA
                          ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {line.speaker} ({line.voiceName})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateLine(line.id, {
                          speaker: isSpeakerA ? speakerBName : speakerAName,
                          voiceName: isSpeakerA ? speakerBVoice : speakerAVoice,
                        })
                      }
                      className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                      title="Swap speaker for this line"
                    >
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Vocal burst tag chips */}
                    <div className="hidden sm:flex items-center gap-1 text-[10px]">
                      {['<laugh>', '<breath>', '|yeah|', '|mhm|'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertTagIntoLine(line.id, tag)}
                          className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 hover:text-sky-300 hover:bg-slate-750 font-mono"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>

                    {lines.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleDeleteLine(line.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete line"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <textarea
                    value={line.text}
                    onChange={(e) => handleUpdateLine(line.id, { text: e.target.value })}
                    placeholder={`What does ${line.speaker} say?`}
                    rows={2}
                    className="w-full bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 resize-y"
                  />

                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="text-slate-500 whitespace-nowrap">Director Style:</span>
                    <input
                      type="text"
                      value={line.stylePrompt}
                      onChange={(e) => handleUpdateLine(line.id, { stylePrompt: e.target.value })}
                      placeholder="e.g. Enthusiastic with natural laugh, breathless alarm, thoughtful quiet tone"
                      className="flex-1 bg-slate-950/40 border border-slate-800/60 rounded px-2 py-1 text-slate-300 text-[11px] focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screenplay Action Bar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="text-xs text-slate-400">
          Screenplay ready: <span className="font-semibold text-white">{lines.length} dialogue turns</span> across{' '}
          <span className="text-sky-300">{speakerAName}</span> and <span className="text-emerald-300">{speakerBName}</span>.
        </div>

        <div className="flex items-center gap-3">
          {hasAudio && (
            <>
              <button
                type="button"
                onClick={onPlayPause}
                className="py-2.5 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Dialogue</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Play Screenplay</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onDownload}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer"
                title="Download Master WAV Audio"
                aria-label="Download WAV"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => onSynthesizeScreenplay(lines)}
            disabled={isGenerating || lines.some((l) => !l.text.trim())}
            className="py-2.5 px-5 rounded-xl font-semibold text-xs bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Synthesizing Screenplay...</span>
              </>
            ) : (
              <>
                <Mic className="w-3.5 h-3.5" />
                <span>Synthesize Full Screenplay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
