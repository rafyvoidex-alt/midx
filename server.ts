import express, { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client with required 'aistudio-build' telemetry header
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Prebuilt voices supported by Gemini 3.8 Flash TTS
const PREBUILT_VOICES = [
  {
    name: 'Kore',
    gender: 'Female',
    style: 'Warm, clear, balanced, natural storyteller',
    pitch: 'Medium',
    tone: 'Radiant & articulate',
  },
  {
    name: 'Puck',
    gender: 'Male',
    style: 'Energetic, dynamic, bright, modern creator',
    pitch: 'Medium-high',
    tone: 'Crisp & engaging',
  },
  {
    name: 'Charon',
    gender: 'Male',
    style: 'Deep, resonant baritone, cinematic narrator',
    pitch: 'Low',
    tone: 'Authoritative & cinematic',
  },
  {
    name: 'Fenrir',
    gender: 'Male',
    style: 'Gravelly, intense, dramatic character actor',
    pitch: 'Low',
    tone: 'Textured & bold',
  },
  {
    name: 'Zephyr',
    gender: 'Female',
    style: 'Gentle, soothing, ASMR & meditation guide',
    pitch: 'Soft medium',
    tone: 'Calm & ethereal',
  },
];

// Endpoint: list available voices
app.get('/api/voices', (_req: Request, res: Response) => {
  res.json({
    voices: PREBUILT_VOICES,
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Endpoint: Single Speaker Speech Generation
app.post('/api/tts/generate', async (req: Request, res: Response) => {
  try {
    const { text, voiceName = 'Kore', stylePrompt, modelChoice } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text prompt is required for speech synthesis.' });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Please check Settings > Secrets.',
        fallbackRequired: true,
      });
    }

    // Determine model: if style bursts / custom persona is requested, use gemini-3.8-flash-tts; otherwise gemini-3.8-flash-lite-tts
    const containsBursts = /<[^>]+>|\|[^|]+\|/.test(text);
    const model = modelChoice || (containsBursts ? 'gemini-3.8-flash-tts' : 'gemini-3.8-flash-lite-tts');

    const cleanVoice = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(voiceName)
      ? voiceName
      : 'Kore';

    const speechMetadata: Record<string, string> = {};
    if (stylePrompt && stylePrompt.trim().length > 0) {
      speechMetadata.style = stylePrompt.trim();
    }

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: text.trim(),
            speechMetadata,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: cleanVoice },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p) => p.inlineData?.data);

    if (!audioPart || !audioPart.inlineData?.data) {
      return res.status(500).json({
        error: 'No audio data was returned by the speech model.',
      });
    }

    const base64Audio = audioPart.inlineData.data;
    const mimeType = audioPart.inlineData.mimeType || 'audio/wav';

    return res.json({
      success: true,
      audioBase64: base64Audio,
      mimeType,
      voiceName: cleanVoice,
      modelUsed: model,
    });
  } catch (error: any) {
    console.error('TTS Generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Speech generation encountered an unexpected error.',
    });
  }
});

// Endpoint: Multi-Speaker Screenplay / Dialogue Generation
app.post('/api/tts/screenplay', async (req: Request, res: Response) => {
  try {
    const { script } = req.body;

    if (!Array.isArray(script) || script.length < 2) {
      return res.status(400).json({
        error: 'Screenplay must contain at least 2 dialogue lines with distinct speakers.',
      });
    }

    if (!ai) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
        fallbackRequired: true,
      });
    }

    const speakersSet = new Set<string>();
    for (const line of script) {
      if (line.speaker && line.speaker.trim()) {
        speakersSet.add(line.speaker.trim());
      }
    }
    const speakers = Array.from(speakersSet);
    if (speakers.length < 2) {
      return res.status(400).json({
        error: 'Multi-speaker screenplay requires at least 2 distinct speakers (e.g. Alex and Jordan).',
      });
    }

    const speakerA = speakers[0];
    const speakerB = speakers[1];

    const voiceA = script.find((l) => l.speaker === speakerA)?.voiceName || 'Puck';
    const voiceB = script.find((l) => l.speaker === speakerB)?.voiceName || 'Kore';

    const parts = script.map((line: any) => ({
      text: `${line.speaker}: ${line.text}`,
      speechMetadata: {
        speaker: line.speaker,
        style: line.stylePrompt || 'Natural dialogue style',
      },
    }));

    const response = await ai.models.generateContent({
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
    });

    const candidate = response.candidates?.[0];
    const audioPart = candidate?.content?.parts?.find((p) => p.inlineData?.data);

    if (!audioPart || !audioPart.inlineData?.data) {
      return res.status(500).json({
        error: 'No screenplay audio was returned by the speech model.',
      });
    }

    return res.json({
      success: true,
      audioBase64: audioPart.inlineData.data,
      mimeType: audioPart.inlineData.mimeType || 'audio/wav',
      speakers: [speakerA, speakerB],
      modelUsed: 'gemini-3.8-flash-tts',
    });
  } catch (error: any) {
    console.error('Screenplay Generation error:', error);
    return res.status(500).json({
      error: error?.message || 'Screenplay generation failed.',
    });
  }
});

// Endpoint: AI Script Director (Enrich plain text with natural human backchannels & bursts)
app.post('/api/tts/enhance-script', async (req: Request, res: Response) => {
  try {
    const { text, mode = 'cinematic' } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }

    if (!ai) {
      // Offline fallback: insert tasteful bursts
      const enhanced = `<breath> ${text.trim()} <sigh>`;
      return res.json({ enhancedText: enhanced });
    }

    const prompt = `You are a world-class voice director for ultra-realistic neural speech synthesis (better than ElevenLabs and Chatterbox).
Take this raw script and inject subtle, natural expressive tags into the text to make it sound unmistakably human and organic.
Use ONLY these exact tags:
- Vocal Bursts: <breath>, <laugh>, <gasp>, <sigh>, <whisper>, <cough>
- Natural Backchannels (for conversational beats): |yeah|, |mhm|, |right|, |oh wow|, |exactly|, |sure|

Mode: ${mode}

Script to enhance:
"""
${text}
"""

Rules:
1. Preserve the original message, tone, and vocabulary. Do not alter core facts.
2. Inject 1 to 4 tags where natural pauses, breaths, chuckles, or conversational beats would occur.
3. Return ONLY the enhanced script text with no explanation or markdown wrapper.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const enhancedText = response.text?.trim() || text;
    return res.json({ enhancedText });
  } catch (error: any) {
    console.error('Enhance script error:', error);
    return res.status(500).json({ error: 'Failed to enhance script.' });
  }
});

// Vite middleware or static serving
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AuraWave TTS Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
