import type { DialogueLine, PrebuiltVoiceName } from '../types/tts.ts';

export const VOCAL_BURSTS = [
  { tag: '<breath>', label: 'Breath', desc: 'Natural inhalation before sentence' },
  { tag: '<laugh>', label: 'Laugh', desc: 'Chuckle or warm laugh' },
  { tag: '<gasp>', label: 'Gasp', desc: 'Surprised sudden intake' },
  { tag: '<sigh>', label: 'Sigh', desc: 'Deep expressive exhale' },
  { tag: '<whisper>', label: 'Whisper', desc: 'Soft confidential vocalization' },
  { tag: '<cough>', label: 'Cough', desc: 'Short organic throat clear' },
];

export const BACKCHANNELS = [
  { tag: '|yeah|', label: 'Yeah', desc: 'Active listening affirmation' },
  { tag: '|mhm|', label: 'Mhm', desc: 'Subtle conversational nod' },
  { tag: '|right|', label: 'Right', desc: 'Empathetic agreement' },
  { tag: '|oh wow|', label: 'Oh wow', desc: 'Authentic reaction' },
  { tag: '|exactly|', label: 'Exactly', desc: 'Strong conversational chime' },
  { tag: '|sure|', label: 'Sure', desc: 'Casual agreement' },
];

/**
 * Calculates realistic speech duration in seconds based on text length and vocal tags.
 */
export function estimateSpeechDuration(text: string, wordsPerMinute: number = 150): number {
  if (!text || text.trim().length === 0) return 0;

  // Strip tags for word count
  const cleanText = text.replace(/<[^>]+>/g, '').replace(/\|[^|]+\|/g, '').trim();
  const words = cleanText.split(/\s+/).filter(Boolean).length;
  const wordSeconds = (words / wordsPerMinute) * 60;

  // Add ~0.6s per vocal burst/backchannel tag for natural pacing
  const burstCount = countVocalBursts(text);
  const tagSeconds = (burstCount.bursts + burstCount.backchannels) * 0.6;

  return Math.max(1, Math.round((wordSeconds + tagSeconds) * 10) / 10);
}

/**
 * Counts the occurrences of expressive vocal bursts and backchannel tags.
 */
export function countVocalBursts(text: string): { bursts: number; backchannels: number; total: number } {
  if (!text) return { bursts: 0, backchannels: 0, total: 0 };
  const burstMatches = text.match(/<[^>]+>/g) || [];
  const backchannelMatches = text.match(/\|[^|]+\|/g) || [];
  return {
    bursts: burstMatches.length,
    backchannels: backchannelMatches.length,
    total: burstMatches.length + backchannelMatches.length,
  };
}

/**
 * Strips vocal tags for plain text subtitles or transcription displays.
 */
export function stripVocalTags(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/\|[^|]+\|/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Validates screenplay lines for multi-speaker TTS synthesis.
 */
export function validateScreenplay(lines: DialogueLine[]): {
  valid: boolean;
  error?: string;
  speakers: string[];
} {
  if (!lines || lines.length === 0) {
    return { valid: false, error: 'Screenplay must have at least one line.', speakers: [] };
  }

  const speakersSet = new Set<string>();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.text || line.text.trim().length === 0) {
      return {
        valid: false,
        error: `Line ${i + 1} for ${line.speaker || 'speaker'} is empty.`,
        speakers: Array.from(speakersSet),
      };
    }
    if (line.speaker) {
      speakersSet.add(line.speaker.trim());
    }
  }

  const speakers = Array.from(speakersSet);
  if (speakers.length < 2) {
    return {
      valid: false,
      error: 'Multi-speaker screenplay requires at least 2 distinct speakers (e.g. Alex and Jordan).',
      speakers,
    };
  }

  if (speakers.length > 2) {
    return {
      valid: false,
      error: 'Dual-speaker screenplay currently supports up to 2 distinct speakers per scene.',
      speakers,
    };
  }

  return { valid: true, speakers };
}

/**
 * Formats request payload for single speaker Gemini TTS.
 */
export function formatSingleSpeakerPayload(
  text: string,
  voiceName: PrebuiltVoiceName = 'Kore',
  stylePrompt?: string
) {
  return {
    model: 'gemini-3.8-flash-lite-tts',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: text.trim(),
            speechMetadata: {
              style: stylePrompt?.trim() || 'Natural, warm, expressive, high-clarity voice',
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  };
}

/**
 * Formats request payload for multi-speaker screenplay Gemini TTS.
 */
export function formatMultiSpeakerPayload(lines: DialogueLine[]) {
  const validation = validateScreenplay(lines);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid screenplay');
  }

  const [speakerA, speakerB] = validation.speakers;

  // Find assigned voice for each speaker
  const lineA = lines.find((l) => l.speaker === speakerA);
  const lineB = lines.find((l) => l.speaker === speakerB);

  const voiceA = lineA?.voiceName || 'Puck';
  const voiceB = lineB?.voiceName || 'Kore';

  const parts = lines.map((l) => ({
    text: `${l.speaker}: ${l.text.trim()}`,
    speechMetadata: {
      speaker: l.speaker,
      style: l.stylePrompt || 'Natural conversational style',
    },
  }));

  return {
    model: 'gemini-3.8-flash-tts',
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: speakerA,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceA } },
            },
            {
              speaker: speakerB,
              voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceB } },
            },
          ],
        },
      },
    },
  };
}

/**
 * Generates standard 44-byte RIFF WAV header for PCM 16-bit audio data.
 */
export function generateWavHeader(
  dataLength: number,
  sampleRate: number = 24000,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Uint8Array {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // "RIFF" chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true); // chunkSize
  writeString(view, 8, 'WAVE');

  // "fmt " sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, byteRate, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // "data" sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true); // Subchunk2Size

  return new Uint8Array(buffer);
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
