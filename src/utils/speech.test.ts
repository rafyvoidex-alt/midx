import test from 'node:test';
import assert from 'node:assert/strict';
import {
  estimateSpeechDuration,
  countVocalBursts,
  stripVocalTags,
  validateScreenplay,
  formatSingleSpeakerPayload,
  formatMultiSpeakerPayload,
  generateWavHeader,
} from './speech.ts';
import type { DialogueLine } from '../types/tts.ts';

test('estimateSpeechDuration returns 0 for empty string', () => {
  assert.equal(estimateSpeechDuration(''), 0);
  assert.equal(estimateSpeechDuration('   '), 0);
});

test('estimateSpeechDuration calculates words and burst pacing accurately', () => {
  // 50 words at 150 wpm = 20 seconds
  const words = Array(50).fill('hello').join(' ');
  const durWithoutBursts = estimateSpeechDuration(words, 150);
  assert.equal(durWithoutBursts, 20);

  // Adding 2 vocal bursts adds ~1.2 seconds
  const textWithBursts = `<breath> ${words} <laugh>`;
  const durWithBursts = estimateSpeechDuration(textWithBursts, 150);
  assert.equal(durWithBursts, 21.2);
});

test('countVocalBursts detects bursts and backchannels correctly', () => {
  const text = 'Hello <breath> how are you? |yeah| I am doing great! <laugh> |mhm|';
  const counts = countVocalBursts(text);
  assert.equal(counts.bursts, 2);
  assert.equal(counts.backchannels, 2);
  assert.equal(counts.total, 4);
});

test('stripVocalTags strips tags and normalizes spaces', () => {
  const text = 'Hello <breath> world!   |yeah|   Good to hear. <laugh>';
  const stripped = stripVocalTags(text);
  assert.equal(stripped, 'Hello world! Good to hear.');
});

test('validateScreenplay enforces minimum speakers and non-empty lines', () => {
  // Empty array
  const emptyRes = validateScreenplay([]);
  assert.equal(emptyRes.valid, false);

  // Single speaker
  const singleSpeakerLines: DialogueLine[] = [
    { id: '1', speaker: 'Alex', voiceName: 'Puck', text: 'Hey there', stylePrompt: '', emotion: 'Neutral' },
  ];
  const singleRes = validateScreenplay(singleSpeakerLines);
  assert.equal(singleRes.valid, false);

  // Two speakers with valid lines
  const validLines: DialogueLine[] = [
    { id: '1', speaker: 'Alex', voiceName: 'Puck', text: 'Hey there Jordan!', stylePrompt: 'Enthusiastic', emotion: 'Happy' },
    { id: '2', speaker: 'Jordan', voiceName: 'Kore', text: 'Hey Alex, great to see you!', stylePrompt: 'Warm', emotion: 'Friendly' },
  ];
  const validRes = validateScreenplay(validLines);
  assert.equal(validRes.valid, true);
  assert.deepEqual(validRes.speakers.sort(), ['Alex', 'Jordan'].sort());

  // Empty line validation
  const emptyLineTest: DialogueLine[] = [
    { id: '1', speaker: 'Alex', voiceName: 'Puck', text: 'Hey!', stylePrompt: '', emotion: 'Neutral' },
    { id: '2', speaker: 'Jordan', voiceName: 'Kore', text: '   ', stylePrompt: '', emotion: 'Neutral' },
  ];
  const emptyLineRes = validateScreenplay(emptyLineTest);
  assert.equal(emptyLineRes.valid, false);
});

test('formatSingleSpeakerPayload returns compliant Gemini config', () => {
  const payload = formatSingleSpeakerPayload('Hello world', 'Kore', 'Joyful and bright');
  assert.equal(payload.model, 'gemini-3.8-flash-lite-tts');
  assert.equal(payload.contents[0].parts[0].text, 'Hello world');
  assert.equal(payload.contents[0].parts[0].speechMetadata.style, 'Joyful and bright');
  assert.equal(payload.config.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName, 'Kore');
});

test('formatMultiSpeakerPayload produces 2-speaker configuration', () => {
  const lines: DialogueLine[] = [
    { id: '1', speaker: 'Alex', voiceName: 'Puck', text: 'Welcome back!', stylePrompt: 'Hyped host', emotion: 'Excited' },
    { id: '2', speaker: 'Sam', voiceName: 'Kore', text: 'Glad to be here.', stylePrompt: 'Calm analyst', emotion: 'Calm' },
  ];
  const payload = formatMultiSpeakerPayload(lines);
  assert.equal(payload.model, 'gemini-3.8-flash-tts');
  assert.equal(payload.config.speechConfig.multiSpeakerVoiceConfig.speakerVoiceConfigs.length, 2);
  assert.equal(payload.contents[0].parts.length, 2);
  assert.equal(payload.contents[0].parts[0].text, 'Alex: Welcome back!');
});

test('generateWavHeader creates valid 44-byte RIFF header', () => {
  const dataLen = 48000; // 1 sec at 24kHz 16-bit
  const header = generateWavHeader(dataLen, 24000, 1, 16);
  assert.equal(header.length, 44);

  // Check "RIFF"
  const riff = String.fromCharCode(...header.slice(0, 4));
  assert.equal(riff, 'RIFF');

  // Check "WAVE"
  const wave = String.fromCharCode(...header.slice(8, 12));
  assert.equal(wave, 'WAVE');

  // Check "fmt "
  const fmt = String.fromCharCode(...header.slice(12, 16));
  assert.equal(fmt, 'fmt ');

  // Check "data"
  const data = String.fromCharCode(...header.slice(36, 40));
  assert.equal(data, 'data');
});
