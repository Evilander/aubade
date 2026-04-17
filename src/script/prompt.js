import { pickEpigraph } from './epigraphs.js';

function formatGitNarrative(git) {
  if (!git.activity?.length) return '(No overnight commits on scanned repos.)';
  const top = git.activity[0];
  const topCommits = top.commits.slice(0, 4).map(c => `    • ${c.subject}`).join('\n');
  const others = git.activity.slice(1, 3).map(r => `  ${r.repo}: ${r.commits.length} commits — ${r.commits[0].subject}`).join('\n');
  return `Primary overnight repo: ${top.repo} (${top.commits.length} commits)\n${topCommits}\n\nAlso:\n${others || '  (none significant)'}`;
}

function formatProjectsNarrative(projects) {
  const top = projects.touched[0];
  const topLine = top
    ? `Most-touched lately: ${top.name} — ${top.filesChanged} files changed, last touched ${humanAgo(top.lastTouched)}.`
    : '(No folder activity in the past week.)';

  const coldPeers = projects.cold.slice(0, 3).map(p => `  - ${p.name} (cold for ${p.staleDays} days)`).join('\n');
  return `${topLine}\n\nOn the edge of cold:\n${coldPeers || '  (nothing on the edge)'}`;
}

function formatYesterday(yesterday) {
  if (!yesterday) return '(No prior broadcast. This is the first one.)';
  return `Yesterday opened with: "${yesterday.openingLine}"
Yesterday's commitment was: "${yesterday.commitment}"
Yesterday's mood was: ${yesterday.moodTag || 'clear'}`;
}

function humanAgo(ms) {
  const diff = Date.now() - ms;
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return 'less than an hour ago';
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

export function buildPrompt({ signals, yesterday, durationSeconds = 180, operatorName = null, extraNotes = null }) {
  const epigraph = pickEpigraph(Date.now() + signals.clock.day);

  const system = `You write a three-minute morning radio broadcast for an audience of one. Plain-voiced. Specific. A little dry. No decoration.

THE SHAPE:
1. One specific opening observation — never a greeting, never a generic abstraction. Name a thing.
2. Two or three short paragraphs. Pick ONE signal as your spine; the others are texture at most. You are not a roll-call announcer — do NOT list every repo with a file count. Tie the spine to a pattern or tension from yesterday's broadcast if one is provided.
3. One closing commitment. Verb-first. Concrete. Time-boxed to ninety minutes. No "address," "engage," "explore," "consider," "dive into," "reflect on." Use: finish, ship, write, merge, delete, fix, publish, rewrite, refactor, call, send, record.

HARD RULES:
- JSON only. No preamble, no markdown fences.
- Target ~${Math.round(durationSeconds * 2.5)} words (~${durationSeconds} spoken seconds).
- Short sentences. Periods over commas. Vary rhythm but lean toward 8-12 word sentences.
- No emojis. No lists. No corporate cheerfulness. No "Good morning."
- BANNED words you must not write: dormant, foyer, ripple, whispers, canvas, tether, folded (as adjective), gentle, pristine, untouched, horizon (unless literal), echoes, surfaces.
- Use "you" no more than four times. The broadcast is overheard.
- A literary touch is allowed — one image, one motif. Not every sentence. If you write "the world is a rumor" you return to that image at the close.
- No tautology. No "someone's early spring cleaning." No "almost slipping from mind." Either say what the signals actually indicate or cut the sentence.

VOICE CHECK: Close to Marilynne Robinson's Gilead in register, but trimmed. Closer still to a poet reading the farm report. You are not reciting a dashboard.

JSON SCHEMA (return exactly this shape):
{
  "openingLine": "One sentence. First words out of the voice's mouth.",
  "script": "Spoken body. Continuous prose. Blank line between paragraphs. TTS will read this verbatim.",
  "commitment": "Verb first. Specific object. Ninety-minute frame. No hedging.",
  "moodTag": "one of: clear, somber, wry, urgent, patient, quiet, restless"
}`;

  const user = `TODAY — ${signals.clock.spoken}, ${signals.clock.year}. Sunrise around ${signals.clock.sunriseSpoken}. Season: ${signals.clock.season}.
${operatorName ? `Operator's first name is ${operatorName}. Use it zero or one time in the broadcast.` : ''}

A seed epigraph (you may weave in, adapt, or ignore; do not name the author unless quoting):
  "${epigraph.text}"  — ${epigraph.attrib}

OVERNIGHT GIT (${signals.git.totalCommits} commits across ${signals.git.reposActive} active repos):
${formatGitNarrative(signals.git)}

PROJECT ACTIVITY (last 7 days):
${formatProjectsNarrative(signals.projects)}

YESTERDAY:
${formatYesterday(yesterday)}
${extraNotes ? `\nEDITORIAL NOTE: ${extraNotes}` : ''}

Write today's broadcast. Pick ONE signal as the narrative spine. Everything else is texture. One commitment.`;

  return { system, user, epigraph };
}
