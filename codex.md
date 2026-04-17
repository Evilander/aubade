# Aubade — Codex Handoff

For the OpenAI coding model (or the next human/AI) picking this up.

## What works right now, end-to-end

1. `npm install`
2. Set `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in `.env`
3. `node bin/aubade.js --dry-run` — renders the CLI with a canned script (no API calls)
4. `node bin/aubade.js --text-only` — generates a real script from Tyler's actual project signals, prints to stdout. Confirmed working on 2026-04-16 using `gpt-4o` fallback path.
5. `node bin/aubade.js` — full experience: generate, synthesize, render TUI, play audio. Works on macOS (afplay), Windows (PowerShell MediaPlayer), and Linux (ffplay).
6. `npx vitest run` — 15 tests, all passing.

## Architecture overview

```
aubade/
├── bin/aubade.js                 # CLI entry point, yargs
├── src/
│   ├── index.js                  # composeAubade() orchestration
│   ├── aggregators/
│   │   ├── clock.js              # date, sunrise (via suncalc)
│   │   ├── git.js                # BFS find repos, `git log --since=24hours`
│   │   ├── projects.js           # recently-modified folders in roots
│   │   ├── files.js              # notes folder walk (optional)
│   │   └── index.js              # gatherSignals() fan-out
│   ├── script/
│   │   ├── epigraphs.js          # literary opening line candidates
│   │   ├── prompt.js             # system + user prompt builder
│   │   └── generate.js           # Anthropic → OpenAI fallback
│   ├── tts/
│   │   ├── openai.js             # gpt-4o-mini-tts, mp3
│   │   ├── kokoro.js             # local via kokoro-js (lazy import)
│   │   └── index.js              # provider selection
│   ├── memory/
│   │   └── store.js              # better-sqlite3, ~/.aubade/aubade.db
│   ├── play/
│   │   └── audio.js              # cross-platform player spawn
│   └── cli/
│       ├── app.js                # Ink root (React.createElement, no JSX)
│       ├── tuner.js              # radio dial visual
│       └── transcript.js         # time-based reveal of script text
├── test/                         # vitest, 4 files
├── landing/index.html            # single-file sunrise landing page
├── CLAUDE.md                     # vision / principles
├── README.md                     # user-facing docs
├── package.json                  # "type": "module", bin.aubade = bin/aubade.js
└── codex.md                      # (this file)
```

## How to run it

```bash
cd B:/projects/claude/genesis-aubade
npm install
cp .env.example .env

# minimum viable test
node bin/aubade.js --dry-run

# real script, no audio cost
OPENAI_API_KEY=sk-... node bin/aubade.js --text-only

# full flow
OPENAI_API_KEY=sk-... AUBADE_ROOTS=B:/projects node bin/aubade.js
```

## Next tasks, in priority order

### 1. Publish to npm (30 min)
```bash
npm login
npm version 0.1.0
npm publish --access public
```
Acceptance: `npx aubade --dry-run` works on a clean machine.

### 2. Ship a demo sample.mp3 to landing (30 min)
The landing page at `landing/index.html` has a play button that looks for `sample.mp3` in the same directory. Generate one with `node bin/aubade.js` and drop it there. This is the "oh shit" moment visitors get.

Acceptance: clicking play on the landing page produces audio.

### 3. Ship the landing to a domain (15 min)
The landing is a single HTML file. Vercel, Netlify, or GitHub Pages. Domain suggestion: `aubade.dev` (check availability).

Acceptance: someone can visit a URL and hear a sample.

### 4. Harden the prompt against flowery language (1 hr)
Current issue: GPT-4o still produces some soft Hallmark-card prose despite anti-examples in the system prompt. Options:
  - Switch default to Claude Opus when available (already implemented — just needs credits)
  - Add a post-generation "edit pass" that strips adjectives and compresses sentences
  - Fine-tune or use structured output with stricter JSON

Acceptance: in a blind read of 10 generated scripts, fewer than 2 contain phrases like "gentle touch," "untouched canvas," "whispered promises."

### 5. Add a `--since=7d` audio digest (2 hr)
A longer-form "week in review" variant. Same pipeline, different duration and prompt shape. Good for Monday mornings.

Acceptance: `aubade weekly` produces a ~6-minute broadcast summarizing the past 7 days.

### 6. Integrate with Audrey (2 hr)
Tyler's Audrey biological-memory MCP is the canonical memory layer. Instead of (or in addition to) the local sqlite, save each aubade as an episodic memory in Audrey. This means the host knows things you told Audrey last Tuesday at 3pm.

Acceptance: when a user has Audrey running, the prompt context includes the last 3 days of salient Audrey memories.

## Adversary review (2026-04-16)

A hostile review scored five axes; three were below 7 (blocking). Here's what was fixed vs. what remains.

**Fixed in this session:**
- Added `src/script/rubric.js` — deterministic post-generation validator: banned phrase list, sentence-length cap, adjective-density cap, vague-commitment-verb rejection, roll-call detection.
- `generateScript()` now runs up to 3 attempts, feeding rubric failures back into the next prompt as an editorial note.
- Prompt rewritten to force a "narrative spine" pattern instead of roll-call. One signal as the body, others as texture.
- Commitment grammar enforced: requires a concrete verb + time box.
- Landing page `sample.mp3` is real audio from a handwritten demo script (voice that actually meets the spec).

**Remaining, ranked:**
1. **Soul/quality still capped by provider.** Claude Opus produces significantly better scripts than GPT-4o, but the hosted billing account is out of credits. Acceptance: with an active Anthropic key, the rubric should pass on the first attempt >80% of the time. (Open an issue to track this and top up credits.)
2. **No feedback loops.** Commitment completion isn't verified (check the target repo for commits at T+90min). No `--rate` flag. Build this before any paid launch.
3. **Audrey integration.** The "memory is structural" claim is load-bearing and not yet delivered — today it's only yesterday's opening line. Wire to Audrey MCP before v0.2.
4. **Business positioning.** Marketing this as a product for paying customers is premature. Ship as a portfolio piece first, validate with Tyler himself using it for 14 days, then decide.
5. **No streaming TTS.** Current path: full audio generated before playback. ~5-8s time-to-first-audio. Switch to the streaming synthesis endpoint when available.

## Known bugs / tech debt

- **gpt-4o-mini-tts** requires the `instructions` parameter, which is a newer field. If the user's `openai` SDK version is old, the TTS call will fail. Pin `openai` to ≥4.68.
- **Windows audio playback** uses a PowerShell one-liner. It works but is ugly. Switch to `sound-play` or `play-sound` npm packages for cleaner cross-platform.
- **git.js ignores merge commits** by default (`--no-merges`) — fine for solo work, wrong for teams. Make this configurable.
- **No streaming**. TTS generates the full audio before playback. Total time-to-first-audio is ~5-8 seconds. Should use the streaming API for progressive playback.
- **Ink TUI flashes on start**. The `render()` call happens before audio is queued, so there's a half-second where the transcript is visible but silent. Sequence it so audio starts at the same moment as the transcript reveal.
- **The "cold" threshold is hardcoded** at 7 days. Should be user-configurable.
- **sample.mp3 not included** in the repo. Landing page shows "sample coming soon" fallback until one is added.

## Required environment variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `ANTHROPIC_API_KEY` | one of two | — | LLM, preferred |
| `OPENAI_API_KEY` | one of two | — | LLM fallback; also TTS |
| `AUBADE_TTS` | no | `openai` | `openai` \| `kokoro` |
| `AUBADE_VOICE` | no | `nova` | OpenAI voice name |
| `AUBADE_MODEL` | no | `claude-opus-4-7` | Anthropic model |
| `AUBADE_DURATION_SECONDS` | no | `180` | target spoken length |
| `AUBADE_ROOTS` | no | home dir | comma-separated roots to scan |
| `AUBADE_AUTHOR` | no | — | filter commits by author |
| `AUBADE_NOTES` | no | — | path to a notes folder |
| `AUBADE_OPERATOR` | no | — | user's name for sparing use |
| `AUBADE_LAT` | no | `39.9` | sunrise latitude |
| `AUBADE_LON` | no | `-91.4` | sunrise longitude |
| `AUBADE_HOME` | no | `~/.aubade` | db + audio cache location |

## How to add providers

### Another LLM

Add `src/script/providers/<name>.js` that exports `async function generate({ system, user, model })` returning `{ openingLine, script, commitment, moodTag }`. Wire into `src/script/generate.js` behind an env flag.

### Another TTS

Add `src/tts/<name>.js` exporting `async function synthesize{Name}({ text, mood, outputPath })` and wire into `src/tts/index.js`. Mood tags to voice instructions mapping is in `src/tts/openai.js::instructionsFor`.

### Another signal aggregator

Add `src/aggregators/<name>.js` exporting `async function collect<Name>({ ...config })` returning `{ kind, ...fields }`. Wire into `src/aggregators/index.js::gatherSignals`. Then format a summary for the prompt in `src/script/prompt.js::formatX`.

## Testing notes

- Aggregator tests use `mkdtempSync` + `utimesSync` to fake file ages.
- Store tests use `vi.resetModules()` plus `AUBADE_HOME=<tmp>` to isolate.
- LLM and TTS are not unit-tested — they're integration-tested by the end-to-end CLI run.
- Ink TUI is not rendered in tests (would need `ink-testing-library`).

## Distribution checklist

- [x] `package.json` has `"type": "module"`, `"bin": {"aubade": "bin/aubade.js"}`, and correct `files` array
- [x] `bin/aubade.js` starts with `#!/usr/bin/env node`
- [x] All deps are in `dependencies`, not `devDependencies`
- [x] `test/` excluded from `files`
- [x] `.env`, `*.mp3` in `.gitignore`
- [x] `LICENSE` exists (MIT)
- [ ] `npm publish --dry-run` shows clean tarball (run this before publishing)
- [ ] `npx aubade` works on a fresh VM

## Tyler-specific context

The author is a solo operator in Illinois with ~60 project folders across B:/projects/claude and A:/ai. He already maintains [Audrey](https://github.com/Evilander/Audrey) as a biological-memory MCP server — Aubade is designed to eventually use Audrey as its source of truth rather than the local sqlite. He prefers ES modules, dislikes flowery prose, and allergy-rejects "Good morning! Here are your priorities." formats. The literary voice is the point.
