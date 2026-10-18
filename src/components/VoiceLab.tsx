import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Play,
  Pause,
  Sliders,
  Check,
  Volume2,
  Trash2,
  Layers,
  ArrowRightLeft,
} from 'lucide-react';
import { VoicePersona, PrebuiltVoiceName } from '../types/tts.ts';
import { CURATED_VOICES } from '../data/voices.ts';

interface VoiceLabProps {
  customVoices: VoicePersona[];
  onAddCustomVoice: (voice: VoicePersona) => void;
  onDeleteCustomVoice: (id: string) => void;
  onPreviewVoice: (text: string, voiceName: PrebuiltVoiceName, style: string) => Promise<void>;
  isPreviewLoading: boolean;
  isPlaying: boolean;
  currentPreviewId: string | null;
}

export const VoiceLab: React.FC<VoiceLabProps> = ({
  customVoices,
  onAddCustomVoice,
  onDeleteCustomVoice,
  onPreviewVoice,
  isPreviewLoading,
  isPlaying,
  currentPreviewId,
}) => {
  // Voice Crafter Form state
  const [name, setName] = useState<string>('Aria · Cyberpunk Detective');
  const [baseVoice, setBaseVoice] = useState<PrebuiltVoiceName>('Fenrir');
  const [gender, setGender] = useState<'Female' | 'Male' | 'Neutral'>('Male');
  const [accent, setAccent] = useState<string>('Neo-Noir Cyberpunk');
  const [category, setCategory] = useState<VoicePersona['category']>('Character');
  const [description, setDescription] = useState<string>(
    'Cynical, gravelly, rain-slicked detective monologue with weary atmospheric cadence.'
  );
  const [stylePrompt, setStylePrompt] = useState<string>(
    'Low gravelly baritone, noir detective narration, weary cynicism with heavy cigarette breath pauses'
  );
  const [sampleText, setSampleText] = useState<string>(
    '<sigh> Neon reflections in the gutter. Another dead synth in Sector 4, and another night with no answers.'
  );

  // A/B Comparison state
  const [abText, setAbText] = useState<string>(
    'The algorithm didn’t just replicate human speech; it discovered the pulse beneath it.'
  );
  const [voiceA, setVoiceA] = useState<PrebuiltVoiceName>('Kore');
  const [voiceB, setVoiceB] = useState<PrebuiltVoiceName>('Charon');
  const [styleA, setStyleA] = useState<string>('Clear, radiant, warm narrative presence');
  const [styleB, setStyleB] = useState<string>('Deep resonant cinematic trailer gravitas');

  const [activeTab, setActiveTab] = useState<'crafter' | 'roster' | 'compare'>('crafter');

  const handleCreateVoice = () => {
    if (!name.trim()) return;
    const newPersona: VoicePersona = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      prebuiltVoice: baseVoice,
      gender,
      accent: accent.trim() || 'Custom',
      category,
      description: description.trim() || 'Custom sculpted AI voice persona',
      defaultStyle: stylePrompt.trim() || 'Natural human cadence',
      sampleText: sampleText.trim() || 'This is my custom designed voice persona.',
      isCustom: true,
    };
    onAddCustomVoice(newPersona);
    setActiveTab('roster');
  };

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('crafter')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'crafter'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Voice Crafter & Designer
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roster')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'roster'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Voice Roster ({CURATED_VOICES.length + customVoices.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compare')}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            activeTab === 'compare'
              ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          A/B Voice Comparison Arena
        </button>
      </div>

      {/* Tab 1: Voice Crafter */}
      {activeTab === 'crafter' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-400" />
                <span>Sculpt a Custom Voice Persona</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Prompt Gemini's flagship neural speech model to generate unique accents, timbres, and emotional personas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Persona Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Marcus · Cyberpunk Detective"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Base Acoustic Engine</label>
                <select
                  value={baseVoice}
                  onChange={(e) => setBaseVoice(e.target.value as PrebuiltVoiceName)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Kore">Kore (Articulate, Warm, Balanced)</option>
                  <option value="Charon">Charon (Deep Resonant Baritone)</option>
                  <option value="Puck">Puck (Fast, Punchy, Bright)</option>
                  <option value="Fenrir">Fenrir (Gravelly, Gritty Rasp)</option>
                  <option value="Zephyr">Zephyr (Whisper-Soft, Ethereal)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Gender Persona</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Neutral">Neutral</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Accent / Dialect Tag</label>
                <input
                  type="text"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  placeholder="e.g. Scottish Highlands, British RP, Brooklyn"
                  className="w-full bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Sonic Style & Direction Prompt (Gemini Neural Instructions)
              </label>
              <textarea
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                rows={2}
                placeholder="Describe vocal rasp, pitch, pace, pauses, emotional texture..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Audition Sample Text</label>
              <textarea
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                rows={2}
                placeholder="Sample sentence to test this persona..."
                className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 resize-none font-sans"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onPreviewVoice(sampleText, baseVoice, stylePrompt)}
                disabled={isPreviewLoading || !sampleText.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 text-sky-300 hover:bg-slate-750 border border-slate-700/80 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isPreviewLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
                    <span>Auditioning Persona...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Audition Voice</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCreateVoice}
                disabled={!name.trim()}
                className="py-2.5 px-5 rounded-xl font-semibold text-xs bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save to Palette</span>
              </button>
            </div>
          </div>

          {/* Persona Inspiration Presets */}
          <div className="lg:col-span-5 rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-300">Quick Persona Templates</h4>
            <div className="space-y-2">
              {[
                {
                  name: 'Cynical Noir Detective',
                  base: 'Fenrir' as const,
                  gender: 'Male' as const,
                  accent: 'Neo-Noir',
                  style: 'Gravelly noir detective narration, weary cynicism, subtle sigh',
                  sample: '<sigh> Rain on the fire escape. Another suspect who conveniently has no memory.',
                },
                {
                  name: 'Bubbly Silicon Valley Host',
                  base: 'Puck' as const,
                  gender: 'Male' as const,
                  accent: 'West Coast US',
                  style: 'Fast-paced, vibrant, tech reviewer with genuine laughter',
                  sample: 'Wait until you hear this output! <laugh> The clarity on high frequencies is unbelievable.',
                },
                {
                  name: 'Royal Botanical Guide',
                  base: 'Zephyr' as const,
                  gender: 'Female' as const,
                  accent: 'British RP',
                  style: 'Soft, whispery, serene nature documentary guide',
                  sample: '<breath> Beneath the ancient canopy, a rare orchid unfurls only in moonlight.',
                },
                {
                  name: 'Epic Fantasy Narrator',
                  base: 'Charon' as const,
                  gender: 'Male' as const,
                  accent: 'Transatlantic Lore',
                  style: 'Deep, resonant baritone, dramatic cinematic trailer pacing',
                  sample: '<breath> Before the kingdoms fell to ash, there existed a flame that could never be quenched.',
                },
              ].map((tpl) => (
                <div
                  key={tpl.name}
                  onClick={() => {
                    setName(tpl.name);
                    setBaseVoice(tpl.base);
                    setGender(tpl.gender);
                    setAccent(tpl.accent);
                    setStylePrompt(tpl.style);
                    setSampleText(tpl.sample);
                  }}
                  className="p-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 hover:border-sky-500/50 hover:bg-slate-900 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 group-hover:text-sky-300">
                      {tpl.name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{tpl.base} engine</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{tpl.style}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Full Voice Roster */}
      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...CURATED_VOICES, ...customVoices].map((voice) => {
            const isPreviewing = currentPreviewId === voice.id && isPlaying;

            return (
              <div
                key={voice.id}
                className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2.5 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">{voice.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300 border border-slate-750">
                      {voice.category}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {voice.gender} · {voice.accent} · Engine: {voice.prebuiltVoice}
                  </div>
                  <p className="text-xs text-slate-300 mt-2 line-clamp-2">{voice.description}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      onPreviewVoice(voice.sampleText, voice.prebuiltVoice, voice.defaultStyle)
                    }
                    className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 hover:text-sky-300 transition-colors py-1 px-2 rounded hover:bg-slate-800"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Audition</span>
                  </button>

                  {voice.isCustom && (
                    <button
                      type="button"
                      onClick={() => onDeleteCustomVoice(voice.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete custom voice"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: A/B Voice Comparison Arena */}
      {activeTab === 'compare' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4 shadow-xl">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-sky-400" />
              <span>A/B Blind & Direct Voice Comparison Arena</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Test identical sentences across different neural voices and styles to evaluate clarity, cadence, and texture.
            </p>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Test Sentence</label>
            <textarea
              value={abText}
              onChange={(e) => setAbText(e.target.value)}
              rows={2}
              className="w-full bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Candidate A */}
            <div className="rounded-lg border border-sky-500/30 bg-sky-950/15 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sky-300">Candidate A</span>
                <span className="text-[10px] font-mono text-slate-400">{voiceA}</span>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Voice</label>
                <select
                  value={voiceA}
                  onChange={(e) => setVoiceA(e.target.value as PrebuiltVoiceName)}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Kore">Kore (Articulate Female)</option>
                  <option value="Charon">Charon (Deep Baritone)</option>
                  <option value="Puck">Puck (Fast Creator)</option>
                  <option value="Fenrir">Fenrir (Gravelly Textures)</option>
                  <option value="Zephyr">Zephyr (Gentle Female)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Style Direction</label>
                <input
                  type="text"
                  value={styleA}
                  onChange={(e) => setStyleA(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <button
                type="button"
                onClick={() => onPreviewVoice(abText, voiceA, styleA)}
                disabled={isPreviewLoading}
                className="w-full py-2 px-3 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Audition Voice A</span>
              </button>
            </div>

            {/* Candidate B */}
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/15 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300">Candidate B</span>
                <span className="text-[10px] font-mono text-slate-400">{voiceB}</span>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Voice</label>
                <select
                  value={voiceB}
                  onChange={(e) => setVoiceB(e.target.value as PrebuiltVoiceName)}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="Charon">Charon (Deep Baritone)</option>
                  <option value="Kore">Kore (Articulate Female)</option>
                  <option value="Puck">Puck (Fast Creator)</option>
                  <option value="Fenrir">Fenrir (Gravelly Textures)</option>
                  <option value="Zephyr">Zephyr (Gentle Female)</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Style Direction</label>
                <input
                  type="text"
                  value={styleB}
                  onChange={(e) => setStyleB(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>
              <button
                type="button"
                onClick={() => onPreviewVoice(abText, voiceB, styleB)}
                disabled={isPreviewLoading}
                className="w-full py-2 px-3 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Audition Voice B</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
