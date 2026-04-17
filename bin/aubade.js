#!/usr/bin/env node
import { render } from 'ink';
import React from 'react';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import gradient from 'gradient-string';
import App from '../src/cli/app.js';
import { composeAubade, playAubadeAudio } from '../src/index.js';
import { listRecent } from '../src/memory/store.js';

const e = React.createElement;

const argv = yargs(hideBin(process.argv))
  .scriptName('aubade')
  .usage('$0 [options]')
  .option('dry-run', { type: 'boolean', default: false, describe: 'Skip LLM and TTS calls; echo a static sample' })
  .option('text-only', { type: 'boolean', default: false, describe: 'Generate the script but do not synthesize audio' })
  .option('recent', { type: 'number', describe: 'List the last N aubades and exit' })
  .option('plain', { type: 'boolean', default: false, describe: 'Print script to stdout instead of rendering Ink UI' })
  .help()
  .version()
  .parseSync();

async function recent(n) {
  const rows = await listRecent(n);
  if (!rows.length) {
    console.log('No aubades recorded yet. Run `aubade` to create your first.');
    return;
  }
  const band = gradient(['#f3c782', '#c9866b']);
  console.log(band('\n  aubade — recent broadcasts\n'));
  for (const r of rows) {
    console.log(`  ${r.date}  ›  ${r.openingLine}`);
    console.log(`            → ${r.commitment}\n`);
  }
}

async function dryRunAubade() {
  return {
    openingLine: 'It\'s April sixteenth, and the fog is burning off the Mississippi.',
    script: 'You pushed four commits to Audrey last night — the memory reconsolidation pass is in. Three projects are cold, but genesis-prism blinked last Thursday, so it is not dead.\n\nThe world is not asking for seventeen things today. The world is asking for one.\n\nYou know which one.',
    commitment: 'Finish the landing page. Ninety minutes. Coffee. Go.',
    moodTag: 'clear',
    audioPath: null,
    durationSeconds: 60,
    dateSpoken: 'Thursday, April 16th',
    epigraph: { text: 'To begin, begin.', attrib: 'William Wordsworth' }
  };
}

async function main() {
  if (argv.recent) {
    await recent(argv.recent);
    return;
  }

  let aubade;
  try {
    aubade = argv.dryRun
      ? await dryRunAubade()
      : await composeAubade({ skipTTS: argv.textOnly });
  } catch (err) {
    console.error('\n  aubade: could not compose today\'s broadcast');
    console.error(`    ${err.message}\n`);
    if (err.message.includes('No LLM key')) {
      console.error('    Set ANTHROPIC_API_KEY (preferred) or OPENAI_API_KEY in .env');
      console.error('    Or run with --dry-run to see the interface without an API call.\n');
    }
    process.exit(1);
  }

  const tuiAvailable = process.stdin.isTTY && process.stdout.isTTY;
  if (argv.plain || !tuiAvailable) {
    if (!tuiAvailable && !argv.plain) {
      console.log('  (stdin/stdout is not a TTY — printing script in plain mode)\n');
    }
    const band = gradient(['#f3c782', '#c9866b']);
    console.log(band(`\n  aubade — ${aubade.dateSpoken}\n`));
    if (aubade.epigraph) {
      console.log(`  "${aubade.epigraph.text}"`);
      console.log(`     — ${aubade.epigraph.attrib}\n`);
    }
    console.log(`  › ${aubade.openingLine}\n`);
    console.log(aubade.script.split('\n').map(l => `  ${l}`).join('\n'));
    console.log(`\n  The one thing: ${aubade.commitment}\n`);
    if (aubade.audioPath) console.log(`  audio: ${aubade.audioPath}\n`);
    if (aubade.rubricWarnings?.length) {
      console.log('  (style rubric warnings — voice quality is degraded without an Anthropic key:)');
      for (const w of aubade.rubricWarnings) console.log(`    - ${w}`);
      console.log('');
    }
    return;
  }

  const { waitUntilExit } = render(e(App, {
    aubade,
    autoPlay: true,
    onStart: () => {
      if (aubade.audioPath) {
        playAubadeAudio(aubade.audioPath).catch(() => { /* headless */ });
      }
    }
  }));
  await waitUntilExit();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
