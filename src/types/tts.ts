export type PrebuiltVoiceName = 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';

export interface VoicePersona {
  id: string;
  name: string;
  prebuiltVoice: PrebuiltVoiceName;
  gender: 'Female' | 'Male' | 'Neutral';
  accent: string;
  category: 'Cinematic' | 'Narrative' | 'Podcast' | 'Commercial' | 'Character' | 'Conversational';
  description: string;
  defaultStyle: string;
  recommendedBurst?: string;
  sampleText: string;
  isCustom?: boolean;
}

export interface DialogueLine {
  id: string;
  speaker: string; // e.g. "Alex" or "Jordan"
  voiceName: PrebuiltVoiceName;
  text: string;
  stylePrompt: string;
  emotion: string;
}

export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  title: string;
  text: string;
  voiceName: string;
  mode: 'single' | 'screenplay';
  audioUrl: string; // Blob or Data URL
  duration: number; // in seconds
  fileSizeBytes?: number;
  speakers?: string[];
}

export interface AudioEffectsConfig {
  speed: number; // 0.5 to 2.0
  pitch: number; // -12 to +12 semitones
  bassBoost: number; // 0 to 10 dB
  presence: number; // 0 to 10 dB
  reverbWet: number; // 0 to 1.0
  volume: number; // 0 to 1.5
}
