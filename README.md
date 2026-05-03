# aubade

A three-minute, voice-narrated morning radio broadcast about your work. Audio-first. Local-first. Built for a solo operator who wants one focused commitment instead of another sprawling todo list.

```bash
npx aubade
```

## What it does

Aubade scans recent project signals, composes a short script, optionally turns it into speech, and stores enough history for tomorrow's broadcast to remember what happened today.

A typical run answers four questions:

- What changed overnight?
- Which project has gone cold?
- What promise carried over from yesterday?
- What is the one concrete thing to do next?

## Install

### Zero-install

```bash
OPENAI_API_KEY=sk-... npx aubade
```

### Global install

```bash
npm install -g aubade
aubade
```

### From source

```bash
git clone https://github.com/evilander/aubade.git
cd aubade
npm install
cp .env.example .env
node bin/aubade.js --dry-run
```

## Configuration

Aubade needs one LLM key. Text-to-speech is optional.

```bash
# LLM, pick one
ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...

# Text-to-speech
AUBADE_TTS=openai
AUBADE_VOICE=nova

# Signal scanning
AUBADE_ROOTS=B:/projects,A:/ai
AUBADE_AUTHOR=you@example.com

# Script shape
AUBADE_DURATION_SECONDS=180
AUBADE_OPERATOR=Operator
AUBADE_LAT=40.7128
AUBADE_LON=-74.0060

# Storage
AUBADE_HOME=
```

## Commands

| Command | What it does |
| --- | --- |
| `aubade` | Generate, synthesize, and play today's aubade. |
| `aubade --text-only` | Generate the script only. No audio. |
| `aubade --dry-run` | Run a canned sample with no API calls. |
| `aubade --plain` | Print to stdout without the TUI. |
| `aubade --recent 7` | List the last seven broadcasts. |

## Shape

Every broadcast follows the same three-beat structure:

1. An opening observation, not a generic greeting.
2. Two or three short paragraphs built from recent signals.
3. One verb-first commitment with a concrete time box.

The generator validates script quality with `src/script/rubric.js`, including banned phrases, sentence length, adjective density, commitment grammar, and roll-call detection. If the rubric fails, Aubade regenerates with the failure notes folded into the next prompt.

## Architecture

```text
aggregators/ -> script/ -> tts/ -> play/
      |           |
      v           v
   signals     memory/
```

- `src/aggregators/` collects git, project, notes, and clock signals.
- `src/script/` builds prompts, calls the model, and applies the style rubric.
- `src/tts/` supports OpenAI and local/offline providers.
- `src/memory/` stores recent broadcasts in SQLite.
- `src/play/` handles cross-platform audio playback.

## Tests

```bash
npm test
```

The original release target covered clock, git, project scanning, prompt generation, rubric checks, and the SQLite store.

## Design Principles

1. Audio-first. Start with the broadcast; the terminal UI is secondary.
2. Local-first. Project folders and git logs stay on your machine.
3. Specific voice. No generic greetings, priority rollups, or motivational filler.
4. Memory is structural. Yesterday's broadcast becomes context for today.
5. Ships as a real artifact. `npx aubade` should work without Docker or a backend.

## License

[MIT](LICENSE) - evilander, 2026.
