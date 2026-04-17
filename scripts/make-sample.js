#!/usr/bin/env node
// One-off: synthesize a handwritten sample script to landing/sample.mp3.
// Used to seed the landing page demo. Requires OPENAI_API_KEY.

import { config as loadEnv } from 'dotenv';
import { synthesizeOpenAI } from '../src/tts/openai.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

loadEnv();

const __dirname = dirname(fileURLToPath(import.meta.url));

const script = `
It is the morning of April sixteenth, and the sun came up at six-fourteen.

Four commits to audrey last night. The memory reconsolidation pass is in. It works. Automation nudged its Snider demo again, which makes seven days in a row, which means something. Termivibe hasn't moved in fourteen days. That's not death. That's shelved.

Yesterday's thing was the landing page. You didn't finish it. Here it is again.

The world is not asking for seventeen things today. The world is asking for one. You know which one.

Finish the landing page. Ninety minutes. Coffee. Go.
`.trim();

const outPath = join(__dirname, '..', 'landing', 'sample.mp3');

console.log('Synthesizing sample to:', outPath);
const result = await synthesizeOpenAI({
  text: script,
  mood: 'clear',
  outputPath: outPath
});
console.log(`  done. ${result.bytes.toLocaleString()} bytes.`);
