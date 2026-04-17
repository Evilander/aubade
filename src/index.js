import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { gatherSignals } from './aggregators/index.js';
import { generateScript } from './script/generate.js';
import { synthesize } from './tts/index.js';
import { saveAubade, getYesterday, getHome } from './memory/store.js';
import { playAudio } from './play/audio.js';

loadEnv();

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export async function composeAubade({ dryRun = false, skipTTS = false, now = new Date() } = {}) {
  const signals = await gatherSignals({
    roots: process.env.AUBADE_ROOTS,
    author: process.env.AUBADE_AUTHOR,
    notes: process.env.AUBADE_NOTES
  });
  const yesterday = await getYesterday(now);

  const durationSeconds = Number(process.env.AUBADE_DURATION_SECONDS || 180);
  const operatorName = process.env.AUBADE_OPERATOR || null;

  const script = await generateScript({
    signals,
    yesterday,
    durationSeconds,
    operatorName,
    strict: process.env.AUBADE_STRICT === '1'
  });

  let audioPath = null;
  if (!dryRun && !skipTTS) {
    const home = await getHome();
    audioPath = join(home, 'audio', `${isoDate(now)}.mp3`);
    await synthesize({
      text: `${script.openingLine}\n\n${script.script}\n\nThe one thing: ${script.commitment}`,
      mood: script.moodTag,
      outputPath: audioPath
    });
  }

  await saveAubade({
    date: isoDate(now),
    openingLine: script.openingLine,
    script: script.script,
    commitment: script.commitment,
    moodTag: script.moodTag,
    audioPath,
    signals,
    durationSeconds
  });

  return {
    ...script,
    audioPath,
    signals,
    durationSeconds,
    dateSpoken: signals.clock.spoken
  };
}

export async function playAubadeAudio(audioPath) {
  if (!audioPath || !existsSync(audioPath)) return;
  return playAudio(audioPath);
}
