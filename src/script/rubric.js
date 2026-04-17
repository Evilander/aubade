// Deterministic style rubric enforced after the LLM returns a script.
// Negative prompting is unreliable — we validate instead of asking nicely.

const BANNED_PHRASES = [
  'dormant', 'foyer', 'ripple', 'whisper', 'whispers', 'whispered',
  'canvas', 'tether', 'tethered', 'folded', 'horizon\'s',
  'untouched', 'pristine', 'unburdened', 'gentle', 'echoes',
  'laid bare', 'laid dormant', 'quiet necessity',
  'digital dust', 'surfaces laid', 'uncharted future',
  'attention spread thin', 'a rumor carries',
  'delicate', 'serene', 'tranquil', 'pensive',
  'into being', 'nudge softly', 'nudged softly'
];

const VAGUE_COMMITMENT_VERBS = [
  'address', 'explore', 'consider', 'engage', 'reflect',
  'dive into', 'dive in', 'tackle', 'look at', 'work on',
  'think about', 'revisit', 'review the', 'check on',
  'approach', 'assess', 'evaluate'
];

const GOOD_COMMITMENT_VERBS = [
  'finish', 'ship', 'publish', 'write', 'rewrite', 'merge',
  'deploy', 'delete', 'fix', 'call', 'send', 'commit',
  'refactor', 'rename', 'record', 'read', 'cut',
  'push', 'open', 'close', 'rename', 'move', 'paste',
  'bounce', 'export', 'print', 'hand'
];

function lower(s) {
  return (s || '').toLowerCase();
}

function countAdjectives(text) {
  // Heuristic: count -ly, -ous, -ive, -ful, -able words as a signal of adjective density.
  const words = text.split(/\s+/);
  const marked = words.filter(w => /(ly|ous|ive|ful|able|less|tial)\b/i.test(w));
  return { total: words.length, flagged: marked.length };
}

function averageSentenceLength(script) {
  const sentences = script.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  if (!sentences.length) return 0;
  const words = sentences.map(s => s.split(/\s+/).length);
  return words.reduce((a, b) => a + b, 0) / sentences.length;
}

export function validateScript({ openingLine, script, commitment }) {
  const problems = [];

  const fullText = `${openingLine} ${script} ${commitment}`;
  const lowText = lower(fullText);

  for (const phrase of BANNED_PHRASES) {
    if (lowText.includes(lower(phrase))) {
      problems.push(`Banned phrase present: "${phrase}"`);
    }
  }

  const avgLen = averageSentenceLength(script);
  if (avgLen > 15) {
    problems.push(`Sentences too long: avg ${avgLen.toFixed(1)} words (target <= 12).`);
  }

  const { total, flagged } = countAdjectives(script);
  if (total > 30 && flagged / total > 0.10) {
    problems.push(`Adjective density too high: ${(flagged / total * 100).toFixed(1)}% (target <= 10%).`);
  }

  const commitmentLow = lower(commitment);
  const firstWord = commitmentLow.split(/\s+/)[0]?.replace(/[^a-z]/g, '');

  if (!firstWord) {
    problems.push('Commitment is empty.');
  } else {
    const isVague = VAGUE_COMMITMENT_VERBS.some(v => commitmentLow.startsWith(v));
    const isGood = GOOD_COMMITMENT_VERBS.includes(firstWord);
    if (isVague) {
      problems.push(`Commitment starts with a vague verb: "${firstWord}". Use a concrete verb.`);
    } else if (!isGood && firstWord.length > 0) {
      // Not on the blacklist, not on the whitelist — soft warning, not blocking.
    }

    if (!/\d+|ninety|sixty|an hour|one hour/i.test(commitment)) {
      problems.push('Commitment lacks a time box (e.g., "ninety minutes").');
    }
  }

  if (script.split(/[.!?]+/).filter(s => /\d+\s+(files?|commits?)\b/i.test(s)).length > 1) {
    problems.push('Too many "N files / N commits" sentences — feels like a roll-call, not prose.');
  }

  return { ok: problems.length === 0, problems };
}

export function summarizeProblems(problems) {
  return problems.map(p => `  - ${p}`).join('\n');
}
