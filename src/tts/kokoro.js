// Kokoro.js local TTS — no API key, no network.
// Loaded lazily because the model is big and most users will use OpenAI.

import { writeFile } from 'node:fs/promises';

export async function synthesizeKokoro({ text, outputPath, voice = 'af_bella' }) {
  const { KokoroTTS } = await import('kokoro-js').catch(() => {
    throw new Error('kokoro-js is not installed. Install with: npm install kokoro-js');
  });

  const modelId = 'onnx-community/Kokoro-82M-v1.0-ONNX';
  const tts = await KokoroTTS.from_pretrained(modelId, { dtype: 'q8' });

  const audio = await tts.generate(text, { voice });
  const wav = audio.toWav();
  await writeFile(outputPath, Buffer.from(wav));
  return { path: outputPath, bytes: wav.byteLength };
}
