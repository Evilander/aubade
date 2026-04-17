import { synthesizeOpenAI } from './openai.js';
import { synthesizeKokoro } from './kokoro.js';

export async function synthesize({ text, mood, outputPath, provider }) {
  const choice = provider || process.env.AUBADE_TTS || 'openai';
  if (choice === 'kokoro') {
    return synthesizeKokoro({ text, outputPath });
  }
  if (choice === 'openai') {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set. Either set it, or use AUBADE_TTS=kokoro for offline TTS.');
    }
    return synthesizeOpenAI({ text, mood, outputPath });
  }
  throw new Error(`Unknown TTS provider: ${choice}. Valid: openai, kokoro.`);
}
