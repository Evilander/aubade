# Aubade

> *n.* a morning song; a poem or lyric about lovers parting at dawn.

Aubade is a CLI that plays you a three-minute, voice-narrated morning aubade — what happened overnight in your code, your calendar, and your world; what matters today; one literary opening line that sets the tone; one specific commitment for the first ninety minutes.

Not a dashboard. Not a chatbot. An *audio experience*.

## Why this exists

Most people who run their own projects have too many projects. The morning is where that noise gets loudest. Notion pages don't fix it. Todo apps don't fix it. A human friend who knew what you did yesterday, what the weather is, and what one damn thing you should work on first — that would fix it. Aubade is that friend, at 6:47 AM, with a voice.

## Core design principles

1. **Audio-first.** You should be able to start your day with headphones in and eyes closed. The TUI is decorative, not required.
2. **Local-first.** Your project folders, git history, notes, and memory stay on your machine. Only the script-generation prompt leaves (and only if you're using a hosted LLM).
3. **Literary voice, not corporate.** The opening line is a quote or aphorism. The register is human and specific. No "Good morning, [user]! Here are your 7 priorities." No emojis. No bullet points in the spoken script.
4. **Memory is structural.** Yesterday's aubade is context for today's. Over a week, patterns emerge. Over a month, the host starts sounding like it knows you — because it does.
5. **Ships as a real artifact.** `npx aubade` works on day one. Landing page deployed. Codex handoff doc exists. This is not a toy.

## Architecture

```
src/
  aggregators/       # Collect signals from your world
    git.js           # Overnight commits across drives
    projects.js     # Recently-modified project folders
    files.js         # Notes folder, inbox stubs
    clock.js         # Date, time, season, moon phase
  script/
    prompt.js        # Build the prompt for Claude
    generate.js      # Call Claude, parse into segments
    voicing.js       # Select literary opening from repertoire
  tts/
    openai.js        # OpenAI TTS (default, reliable)
    kokoro.js        # Kokoro.js local (no API key)
    index.js         # Provider selection
  memory/
    store.js         # SQLite: past aubades + signals
    recall.js        # "What was yesterday's show?"
  cli/
    app.jsx          # Ink root
    tuner.jsx        # Radio-tuning visual
    transcript.jsx   # Scrolling transcript
  play/
    audio.js         # Cross-platform audio playback
bin/
  aubade.js          # Entry point (shebang)
landing/
  index.html         # Single-file landing with embedded sample
test/                # Vitest
```

## Tech stack

- **Node.js 20+**, ES modules only (never CommonJS)
- **Ink 5** for the TUI (React in the terminal)
- **better-sqlite3** for memory (same as Audrey)
- **@anthropic-ai/sdk** for script generation
- **OpenAI TTS** default, Kokoro.js local optional
- **Vitest** for tests
- **No bundler required** for the CLI; landing page is single HTML file

## Conventions

- Every module: <200 lines, single responsibility, default export + named helpers.
- No comments except when explaining a non-obvious invariant.
- No try/catch "just in case" — fail loud at the boundary, let the CLI handler show a nice error.
- No TODO comments. If something isn't built, it's not referenced.
- Tests next to the code they test (`*.test.js`), run with `vitest`.

## What "done" looks like

- [x] `npx aubade` downloads and runs with a single `OPENAI_API_KEY`
- [x] Generates a three-minute audio from real signals on Tyler's machine
- [x] Plays automatically with a beautiful TUI transcript
- [x] Yesterday's show is referenced in today's show
- [x] Landing page at `landing/index.html` with embedded demo audio
- [x] codex.md exists and is accurate
- [x] README runs cleanly end-to-end
- [x] Tests pass
