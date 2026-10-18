import { AudioEffectsConfig } from '../types/tts.ts';

class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private gainNode: GainNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;

  private startTime: number = 0;
  private pausedAt: number = 0;
  private isPlaying: boolean = false;
  private playbackRate: number = 1.0;
  private onEndedCallback: (() => void) | null = null;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx({ sampleRate: 24000 });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getContext(): AudioContext {
    this.initContext();
    return this.ctx!;
  }

  /**
   * Generates a smooth synthetic impulse response for studio reverb
   */
  private createImpulseResponse(duration = 1.5, decay = 2.0): AudioBuffer {
    this.initContext();
    const rate = this.ctx!.sampleRate;
    const length = rate * duration;
    const impulse = this.ctx!.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const factor = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }

  /**
   * Decodes an ArrayBuffer or Base64 string into an AudioBuffer
   */
  public async decodeAudio(data: ArrayBuffer | string): Promise<AudioBuffer> {
    this.initContext();
    let arrayBuffer: ArrayBuffer;

    if (typeof data === 'string') {
      // Clean base64 string
      const cleanBase64 = data.replace(/^data:audio\/\w+;base64,/, '').trim();
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      arrayBuffer = bytes.buffer;
    } else {
      arrayBuffer = data;
    }

    try {
      return await this.ctx!.decodeAudioData(arrayBuffer.slice(0));
    } catch (err) {
      console.warn('decodeAudioData failed, constructing PCM buffer manually', err);
      // Fallback: create buffer manually from 24kHz 16-bit mono PCM if WAV header stripped
      const pcm16 = new Int16Array(arrayBuffer);
      const buffer = this.ctx!.createBuffer(1, pcm16.length, 24000);
      const channel = buffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        channel[i] = pcm16[i] / 32768.0;
      }
      return buffer;
    }
  }

  /**
   * Plays the given AudioBuffer through the studio mastering chain
   */
  public playBuffer(
    buffer: AudioBuffer,
    effects: AudioEffectsConfig,
    offset = 0,
    onEnded?: () => void
  ) {
    this.initContext();
    this.stop();

    this.currentBuffer = buffer;
    this.playbackRate = effects.speed || 1.0;
    this.onEndedCallback = onEnded || null;

    // Create source
    this.currentSource = this.ctx!.createBufferSource();
    this.currentSource.buffer = buffer;
    this.currentSource.playbackRate.value = this.playbackRate;

    // Master Gain
    this.gainNode = this.ctx!.createGain();
    this.gainNode.gain.value = effects.volume ?? 1.0;

    // Bass Warmth (Low shelf filter at 200 Hz)
    this.bassFilter = this.ctx!.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 200;
    this.bassFilter.gain.value = effects.bassBoost ?? 0;

    // Studio Presence (High shelf filter at 3500 Hz)
    this.presenceFilter = this.ctx!.createBiquadFilter();
    this.presenceFilter.type = 'highshelf';
    this.presenceFilter.frequency.value = 3500;
    this.presenceFilter.gain.value = effects.presence ?? 0;

    // Studio Reverb Node
    this.reverbNode = this.ctx!.createConvolver();
    this.reverbNode.buffer = this.createImpulseResponse(1.2, 3.0);
    this.reverbGain = this.ctx!.createGain();
    this.reverbGain.gain.value = effects.reverbWet ?? 0.05;

    this.dryGain = this.ctx!.createGain();
    this.dryGain.gain.value = 1.0 - (effects.reverbWet ? effects.reverbWet * 0.5 : 0);

    // Analyser Node for Visualizer
    this.analyser = this.ctx!.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    // Routing Graph:
    // Source -> Bass -> Presence -> (DryGain + ReverbNode->ReverbGain) -> Master Gain -> Analyser -> Destination
    this.currentSource.connect(this.bassFilter);
    this.bassFilter.connect(this.presenceFilter);

    // Split to dry and wet
    this.presenceFilter.connect(this.dryGain);
    this.dryGain.connect(this.gainNode);

    this.presenceFilter.connect(this.reverbNode);
    this.reverbNode.connect(this.reverbGain);
    this.reverbGain.connect(this.gainNode);

    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.ctx!.destination);

    this.startTime = this.ctx!.currentTime - offset;
    this.pausedAt = 0;
    this.isPlaying = true;

    this.currentSource.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.pausedAt = 0;
        if (this.onEndedCallback) {
          this.onEndedCallback();
        }
      }
    };

    this.currentSource.start(0, offset);
  }

  public updateEffects(effects: AudioEffectsConfig) {
    if (!this.ctx) return;
    if (this.gainNode) {
      this.gainNode.gain.setTargetAtTime(effects.volume, this.ctx.currentTime, 0.05);
    }
    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(effects.bassBoost, this.ctx.currentTime, 0.05);
    }
    if (this.presenceFilter) {
      this.presenceFilter.gain.setTargetAtTime(effects.presence, this.ctx.currentTime, 0.05);
    }
    if (this.reverbGain && this.dryGain) {
      this.reverbGain.gain.setTargetAtTime(effects.reverbWet, this.ctx.currentTime, 0.05);
      this.dryGain.gain.setTargetAtTime(1.0 - effects.reverbWet * 0.5, this.ctx.currentTime, 0.05);
    }
    if (this.currentSource && effects.speed) {
      this.currentSource.playbackRate.setTargetAtTime(effects.speed, this.ctx.currentTime, 0.05);
      this.playbackRate = effects.speed;
    }
  }

  public pause(): number {
    if (!this.isPlaying || !this.ctx) return 0;
    const elapsed = (this.ctx.currentTime - this.startTime) * this.playbackRate;
    this.stop();
    this.pausedAt = elapsed;
    return elapsed;
  }

  public stop() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // already stopped
      }
      this.currentSource = null;
    }
    this.isPlaying = false;
  }

  public getCurrentTime(): number {
    if (!this.ctx || !this.isPlaying) return this.pausedAt;
    const elapsed = (this.ctx.currentTime - this.startTime) * this.playbackRate;
    return Math.min(elapsed, this.currentBuffer ? this.currentBuffer.duration : 0);
  }

  public getDuration(): number {
    return this.currentBuffer ? this.currentBuffer.duration : 0;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Browser Web Speech API fallback for instantaneous playback
   */
  public speakWithBrowserSynthesis(
    text: string,
    voiceName: string,
    speed = 1.0,
    pitch = 1.0,
    onEnd?: () => void
  ) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/<[^>]+>/g, '').replace(/\|[^|]+\|/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Pick closest voice
    const voices = window.speechSynthesis.getVoices();
    const isFemale = voiceName === 'Kore' || voiceName === 'Zephyr';
    const foundVoice = voices.find((v) =>
      isFemale
        ? v.name.toLowerCase().includes('female') ||
          v.name.toLowerCase().includes('samantha') ||
          v.name.toLowerCase().includes('karen') ||
          v.name.toLowerCase().includes('zira')
        : v.name.toLowerCase().includes('male') ||
          v.name.toLowerCase().includes('david') ||
          v.name.toLowerCase().includes('alex') ||
          v.name.toLowerCase().includes('daniel')
    );

    if (foundVoice) {
      utterance.voice = foundVoice;
    }

    utterance.rate = Math.max(0.5, Math.min(2.0, speed));
    utterance.pitch = Math.max(0.5, Math.min(2.0, pitch));

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Triggers download of a Base64 or Blob as a standard .wav file
   */
  public downloadAudioFile(data: string | Blob, filename: string = 'aurawave-voice.wav') {
    let url: string;
    if (typeof data === 'string') {
      const cleanBase64 = data.replace(/^data:audio\/\w+;base64,/, '').trim();
      const byteChars = atob(cleanBase64);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      url = URL.createObjectURL(blob);
    } else {
      url = URL.createObjectURL(data);
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
}

export const studioAudio = new StudioAudioEngine();
