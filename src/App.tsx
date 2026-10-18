import React, { useState, useEffect, useRef } from 'react';
import { Header, StudioMode } from './components/Header.tsx';
import { SingleSpeakerStudio } from './components/SingleSpeakerStudio.tsx';
import { ScreenplayStudio } from './components/ScreenplayStudio.tsx';
import { VoiceLab } from './components/VoiceLab.tsx';
import { AudioVisualizer } from './components/AudioVisualizer.tsx';
import { AudioEffectsRack } from './components/AudioEffectsRack.tsx';
import { AudioHistoryDrawer } from './components/AudioHistoryDrawer.tsx';
import {
  DialogueLine,
  PrebuiltVoiceName,
  VoicePersona,
  GenerationHistoryItem,
  AudioEffectsConfig,
} from './types/tts.ts';
import { studioAudio } from './utils/audioEngine.ts';
import { estimateSpeechDuration } from './utils/speech.ts';
import { CURATED_VOICES } from './data/voices.ts';

export default function App() {
  const [mode, setMode] = useState<StudioMode>('single');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [currentAudioBase64, setCurrentAudioBase64] = useState<string | null>(null);
  const [currentBuffer, setCurrentBuffer] = useState<AudioBuffer | null>(null);
  const [currentVoiceName, setCurrentVoiceName] = useState<string>('Charon');
  const [activeScreenplayLineIndex, setActiveScreenplayLineIndex] = useState<number>(-1);

  // Audio Effects Config
  const [effects, setEffects] = useState<AudioEffectsConfig>({
    speed: 1.0,
    pitch: 0,
    bassBoost: 1.5, // subtle warm low-end boost by default
    presence: 1.0, // subtle crisp high-end presence by default
    reverbWet: 0.08,
    volume: 1.0,
  });

  // Custom User-Created Voice Personas
  const [customVoices, setCustomVoices] = useState<VoicePersona[]>(() => {
    try {
      const saved = localStorage.getItem('aurawave_custom_voices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Generation History Reel
  const [history, setHistory] = useState<GenerationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('aurawave_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentPlayingHistoryId, setCurrentPlayingHistoryId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const playbackTimerRef = useRef<number | null>(null);

  // Save custom voices & history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aurawave_custom_voices', JSON.stringify(customVoices));
    } catch (e) {
      console.warn('localStorage save failed', e);
    }
  }, [customVoices]);

  useEffect(() => {
    try {
      localStorage.setItem('aurawave_history', JSON.stringify(history));
    } catch (e) {
      console.warn('localStorage save failed', e);
    }
  }, [history]);

  // Track playback time
  useEffect(() => {
    if (isPlaying) {
      playbackTimerRef.current = window.setInterval(() => {
        const t = studioAudio.getCurrentTime();
        setCurrentTime(t);
        if (duration > 0 && t >= duration) {
          setIsPlaying(false);
          setCurrentTime(0);
          setActiveScreenplayLineIndex(-1);
        }
      }, 50);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
    };
  }, [isPlaying, duration]);

  // Update real-time audio node mastering when effects sliders move
  const handleEffectsChange = (newEffects: AudioEffectsConfig) => {
    setEffects(newEffects);
    studioAudio.updateEffects(newEffects);
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  /**
   * Generates single-speaker speech
   */
  const handleGenerateSingle = async (
    text: string,
    voiceName: PrebuiltVoiceName,
    stylePrompt: string
  ) => {
    if (!text.trim()) return;
    setIsGenerating(true);
    setCurrentVoiceName(voiceName);

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceName,
          stylePrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.audioBase64) {
        // Graceful fallback to browser speech synthesis
        const msg = data.error || 'Gemini TTS unavailable; using Studio browser engine.';
        showToast(msg, 'info');

        studioAudio.speakWithBrowserSynthesis(text, voiceName, effects.speed, 1.0, () => {
          setIsPlaying(false);
        });
        setIsPlaying(true);
        setDuration(estimateSpeechDuration(text));
        return;
      }

      // Success: decode audio with Web Audio API
      setCurrentAudioBase64(data.audioBase64);
      const audioBuffer = await studioAudio.decodeAudio(data.audioBase64);
      setCurrentBuffer(audioBuffer);
      setDuration(audioBuffer.duration);
      setCurrentTime(0);

      // Auto play with studio mastering
      studioAudio.playBuffer(audioBuffer, effects, 0, () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      setIsPlaying(true);

      // Add to generation reel
      const historyItem: GenerationHistoryItem = {
        id: `take-${Date.now()}`,
        timestamp: Date.now(),
        title: text.substring(0, 36) + (text.length > 36 ? '...' : ''),
        text,
        voiceName,
        mode: 'single',
        audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
        duration: audioBuffer.duration,
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 20)]);
      showToast('Neural speech generated at studio 24kHz quality!', 'success');
    } catch (err: any) {
      console.error('Generation error:', err);
      showToast(err.message || 'Speech generation encountered an error.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generates dual-speaker screenplay speech
   */
  const handleSynthesizeScreenplay = async (lines: DialogueLine[]) => {
    setIsGenerating(true);

    try {
      const res = await fetch('/api/tts/screenplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: lines }),
      });

      const data = await res.json();

      if (!res.ok || !data.audioBase64) {
        showToast(data.error || 'Screenplay generation unavailable on server.', 'error');
        return;
      }

      setCurrentAudioBase64(data.audioBase64);
      const audioBuffer = await studioAudio.decodeAudio(data.audioBase64);
      setCurrentBuffer(audioBuffer);
      setDuration(audioBuffer.duration);
      setCurrentTime(0);

      // Play with synchronized line tracking
      studioAudio.playBuffer(audioBuffer, effects, 0, () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setActiveScreenplayLineIndex(-1);
      });
      setIsPlaying(true);

      // Add to history
      const historyItem: GenerationHistoryItem = {
        id: `screenplay-${Date.now()}`,
        timestamp: Date.now(),
        title: `Dialogue: ${lines[0].speaker} & ${lines[1]?.speaker || 'Jordan'} (${lines.length} turns)`,
        text: lines.map((l) => `${l.speaker}: ${l.text}`).join(' · '),
        voiceName: `${lines[0].speaker} & ${lines[1]?.speaker}`,
        mode: 'screenplay',
        audioUrl: `data:audio/wav;base64,${data.audioBase64}`,
        duration: audioBuffer.duration,
        speakers: Array.from(new Set(lines.map((l) => l.speaker))),
      };
      setHistory((prev) => [historyItem, ...prev.slice(0, 20)]);
      showToast('Screenplay synthesized with dual-character dialogue!', 'success');
    } catch (err: any) {
      console.error('Screenplay generation failed:', err);
      showToast(err.message || 'Screenplay generation failed.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Audition voice in Voice Lab
   */
  const handleAuditionVoice = async (
    sampleText: string,
    voiceName: PrebuiltVoiceName,
    style: string
  ) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voiceName,
          stylePrompt: style,
        }),
      });

      const data = await res.json();
      if (data.audioBase64) {
        setCurrentAudioBase64(data.audioBase64);
        const buf = await studioAudio.decodeAudio(data.audioBase64);
        setCurrentBuffer(buf);
        setDuration(buf.duration);
        studioAudio.playBuffer(buf, effects, 0, () => {
          setIsPlaying(false);
        });
        setIsPlaying(true);
      } else {
        studioAudio.speakWithBrowserSynthesis(sampleText, voiceName, effects.speed, 1.0);
      }
    } catch (err) {
      console.error('Audition error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Play / Pause toggle
   */
  const handlePlayPause = () => {
    if (!currentBuffer) return;
    if (isPlaying) {
      studioAudio.pause();
      setIsPlaying(false);
    } else {
      studioAudio.playBuffer(currentBuffer, effects, currentTime, () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
      setIsPlaying(true);
    }
  };

  /**
   * Scrubbing in visualizer
   */
  const handleSeek = (seekTime: number) => {
    if (!currentBuffer) return;
    setCurrentTime(seekTime);
    if (isPlaying) {
      studioAudio.playBuffer(currentBuffer, effects, seekTime, () => {
        setIsPlaying(false);
        setCurrentTime(0);
      });
    }
  };

  /**
   * Master WAV Download
   */
  const handleDownload = () => {
    if (!currentAudioBase64) return;
    studioAudio.downloadAudioFile(currentAudioBase64, `aurawave-${currentVoiceName.toLowerCase()}.wav`);
  };

  /**
   * Play from history reel
   */
  const handlePlayHistoryItem = async (item: GenerationHistoryItem) => {
    try {
      setCurrentPlayingHistoryId(item.id);
      setCurrentAudioBase64(item.audioUrl);
      const buf = await studioAudio.decodeAudio(item.audioUrl);
      setCurrentBuffer(buf);
      setDuration(buf.duration);
      studioAudio.playBuffer(buf, effects, 0, () => {
        setIsPlaying(false);
        setCurrentPlayingHistoryId(null);
      });
      setIsPlaying(true);
    } catch (err) {
      console.error('History play error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0d13] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Studio Header */}
      <Header currentMode={mode} onSelectMode={setMode} hasApiKey={true} />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Real-time Visualizer & Scrub Deck */}
        <section aria-label="Audio Visualizer Deck">
          <AudioVisualizer
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
          />
        </section>

        {/* Studio Modes */}
        {mode === 'single' && (
          <SingleSpeakerStudio
            onGenerate={handleGenerateSingle}
            isGenerating={isGenerating}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onDownload={handleDownload}
            hasAudio={!!currentBuffer}
            customVoices={customVoices}
          />
        )}

        {mode === 'screenplay' && (
          <ScreenplayStudio
            onSynthesizeScreenplay={handleSynthesizeScreenplay}
            isGenerating={isGenerating}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            onDownload={handleDownload}
            hasAudio={!!currentBuffer}
            activeLineIndex={activeScreenplayLineIndex}
          />
        )}

        {mode === 'voicelab' && (
          <VoiceLab
            customVoices={customVoices}
            onAddCustomVoice={(v) => {
              setCustomVoices([v, ...customVoices]);
              showToast(`Created custom persona: ${v.name}`, 'success');
            }}
            onDeleteCustomVoice={(id) => {
              setCustomVoices(customVoices.filter((v) => v.id !== id));
            }}
            onPreviewVoice={handleAuditionVoice}
            isPreviewLoading={isGenerating}
            isPlaying={isPlaying}
            currentPreviewId={null}
          />
        )}

        {/* Mastering & Effects Rack */}
        <section aria-label="Mastering Effects Rack">
          <AudioEffectsRack effects={effects} onChange={handleEffectsChange} />
        </section>

        {/* Master Audio Reel Drawer */}
        <section aria-label="Audio History Reel">
          <AudioHistoryDrawer
            history={history}
            currentPlayingId={currentPlayingHistoryId}
            isPlaying={isPlaying}
            onPlayItem={handlePlayHistoryItem}
            onDownloadItem={(item) => studioAudio.downloadAudioFile(item.audioUrl, `${item.id}.wav`)}
            onClearHistory={() => setHistory([])}
          />
        </section>
      </main>

      {/* Floating Notification Toast */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40'
              : notification.type === 'error'
              ? 'bg-rose-950/90 text-rose-200 border-rose-500/40'
              : 'bg-slate-900/90 text-sky-200 border-sky-500/40'
          }`}
        >
          <span>{notification.message}</span>
        </div>
      )}

      {/* Subtle Studio Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        AuraWave Studio · Powered by Gemini 3.8 Flash Neural Speech Architecture · 24kHz Studio RIFF WAV
      </footer>
    </div>
  );
}
