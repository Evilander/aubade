import OpenAI from 'openai';
import { writeFile } from 'node:fs/promises';

const MODEL = process.env.AUBADE_TTS_MODEL || 'gpt-4o-mini-tts';
const VOICE = process.env.AUBADE_VOICE || 'nova';

function instructionsFor(mood) {
  const map = {
    clear: 'Read in a calm, measured voice. A touch of warmth. Pace the sentences naturally — do not rush. Pauses at periods should feel earned.',
    somber: 'Read quietly and deliberately, with a hint of gravity. Do not whisper. Hold the pauses a beat longer than feels comfortable.',
    wry: 'Read with light amusement sitting underneath the words. Never wink. The listener should sense a half-smile without hearing one.',
    urgent: 'Read with steadier forward motion but not hurried. The urgency is in the content, not in the voice raising.',
    patient: 'Read slowly and generously. Leave room for the listener to catch up. This is a voice that has time.',
    quiet: 'Read at low volume level, intimate register, as if speaking to one person across a small room at dawn.',
    restless: 'Read with a slight edge, unsettled rhythm, some sentences shorter than they want to be.'
  };
  return map[mood] || map.clear;
}

export async function synthesizeOpenAI({ text, mood = 'clear', outputPath }) {
  const client = new OpenAI();
  const response = await client.audio.speech.create({
    model: MODEL,
    voice: VOICE,
    input: text,
    instructions: instructionsFor(mood),
    response_format: 'mp3'
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, buffer);
  return { path: outputPath, bytes: buffer.length };
}
