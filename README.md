<div align="center">

# aubade

**_n._ a morning song; a poem or lyric about lovers parting at dawn.**

*A three-minute voice-narrated morning radio broadcast about your life.*

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-2a1f18?style=flat-square&labelColor=f4ead6)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-2a1f18?style=flat-square&labelColor=f4ead6)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-21%20passing-2a1f18?style=flat-square&labelColor=f4ead6)](#tests)
[![Voice](https://img.shields.io/badge/voice-literary-a8705e?style=flat-square&labelColor=f4ead6)](#the-shape)

</div>

---

Your overnight commits. Your cold projects. Yesterday's broken promise. Today's **one** thing. Read aloud by a voice that isn't trying to sell you anything. Thirty seconds of setup, three minutes of listening, ninety minutes of focused work. That's the whole contract.

```bash
npx aubade
```

## A sample broadcast

> "It's Tuesday, April sixteenth, and the sun came up at six fifty-three. You pushed four commits to Audrey last night — the memory reconsolidation pass is in. Three projects are cold, but genesis-prism blinked last Thursday, so it's not dead. One thing to do today, and only one: **finish the landing page. Ninety minutes. Coffee. Go.**"

[▶ Listen to the sample](landing/sample.mp3) · [Visit the landing page](landing/index.html)

## What it looks like

```
 ╭──────────────────────────────────────────────────────────────────╮
 │                                                                  │
 │  W — AUB                  88.3 FM                      ◉ ON AIR  │
 │                                                                  │
 │        ▼───────────────────────────────────────                  │
 │        │    │    │    │    │    │    │    │                      │
 │                                                                  │
 │  Thursday, April 16th            mood: clear              ))) )  │
 │                                                                  │
 ╰──────────────────────────────────────────────────────────────────╯

   "Every morning I wake and the world is a rumor."
      — after Jack Gilbert

 › Four commits to audrey last night. The reconsolidation pass is in.

   Termivibe hasn't moved in fourteen days. That's not death. That's
   shelved. Yesterday's thing was the landing page. You didn't finish
   it. Here it is again.

   The world is not asking for seventeen things today. The world is
   asking for one. You know which one.

 ┌──────────────────────────────────────────────────────────────────┐
 │  The one thing: Finish the landing page. Ninety minutes.         │
 └──────────────────────────────────────────────────────────────────┘

   space: play  ·  r: replay  ·  q: quit
```

## Why this exists

I have sixty-something project folders across two drives. Most half-finished. Some genuinely good. All of them compete for attention every morning. A Notion page doesn't help. A todo app doesn't help. What helps, a little, is a patient voice that says *you wrote four commits to audrey last night, the landing page is still undone, that's the thing for the next ninety minutes.*

Aubade is that voice.

## Install

### Zero-install (when published)

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
cp .env.example .env   # add your keys
node bin/aubade.js --dry-run   # verify install; no API calls
```

## Configuration

Aubade needs one LLM key. Everything else is optional.

```bash
# --- LLM (required, pick one) ---
ANTHROPIC_API_KEY=sk-ant-...    # preferred — follows the style rubric
# OPENAI_API_KEY=sk-...          # fallback — works, but prosier

# --- Text-to-speech ---
AUBADE_TTS=openai               # or "kokoro" for local/offline
AUBADE_VOICE=nova               # any OpenAI voice

# --- Signal scanning ---
AUBADE_ROOTS=B:/projects,A:/ai  # comma-separated roots to scan
AUBADE_AUTHOR=you@example.com   # filter commits by author

# --- Script shape ---
AUBADE_DURATION_SECONDS=180     # ~3 minutes
AUBADE_OPERATOR=Tyler           # your name, used at most once
AUBADE_LAT=39.9                 # for sunrise (default: Quincy, IL)
AUBADE_LON=-91.4

# --- Storage ---
AUBADE_HOME=                    # default: ~/.aubade
```

## Commands

| Command | What it does |
|---|---|
| `aubade` | Generate + synthesize + play today's aubade. Renders the Ink TUI. |
| `aubade --text-only` | Generate the script only. No audio. |
| `aubade --dry-run` | Canned sample. No API calls. Useful for verifying install. |
| `aubade --plain` | Print to stdout without the TUI (good for cron / CI / pipes). |
| `aubade --recent 7` | List the last seven broadcasts. |

## Scheduling

### cron (macOS / Linux)

```cron
30 6 * * 1-5 /usr/local/bin/aubade --plain > ~/.aubade/log 2>&1
```

### Task Scheduler (Windows)

```powershell
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c npx aubade"
$trigger = New-ScheduledTaskTrigger -Daily -At 6:30am
Register-ScheduledTask -TaskName "Aubade" -Action $action -Trigger $trigger
```

## The shape

Every broadcast follows the same three-beat structure:

1. **An opening observation** — never a greeting, always specific. A line you didn't expect from a morning app.
2. **Two or three short paragraphs** — one signal is the spine, the others are texture. No roll-call of every repo.
3. **One commitment** — verb first, concrete, time-boxed to ninety minutes.

The voice is Marilynne Robinson in Gilead, trimmed. A literary touch is allowed — one image, one motif — but never flowery.

## How it works

```
┌────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ aggregators/   │    │ script/          │    │ tts/             │
│  git           │ →  │  prompt.js       │ →  │  openai.js       │
│  projects      │    │  generate.js     │    │  kokoro.js       │
│  notes         │    │  rubric.js ◀──┐  │    │                  │
│  clock         │    │   (regen loop)│  │    └──────────────────┘
└────────────────┘    └───────────────┘──┘              │
        │                     │                         ▼
        │                     │                  ┌──────────────┐
        │                     ▼                  │ ~/.aubade/   │
        │          ┌──────────────────┐          │  audio/*.mp3 │
        └─────────→│ memory/          │          └──────────────┘
                   │   aubade.db      │                 │
                   │   (sqlite)       │                 ▼
                   └──────────────────┘       ┌──────────────────┐
                             │                │ play/audio.js    │
                             ▼                │ (cross-platform) │
                    yesterday becomes         └──────────────────┘
                    context for today
```

### The style rubric

LLMs write flowery prose if you let them. Aubade doesn't ask nicely — it validates. After the model returns a script, `src/script/rubric.js` checks:

- **No banned phrases** — _dormant, foyer, ripple, whispers, canvas, tether, pristine,_ and a growing blacklist
- **Sentence length** — average ≤ 12 words
- **Adjective density** — ≤ 10% of words
- **Commitment grammar** — must start with a concrete verb and name a time box
- **No roll-call** — more than one "N files changed" sentence = reject

If the rubric fails, the generator regenerates up to 3 times, feeding the failure notes back into the next prompt.

## Tests

```bash
npm test
```

**21 tests passing** across clock / git / projects / prompt / rubric / store:

```
 ✓ test/clock.test.js      (4 tests)
 ✓ test/prompt.test.js     (5 tests)
 ✓ test/projects.test.js   (3 tests)
 ✓ test/rubric.test.js     (6 tests)
 ✓ test/store.test.js      (3 tests)
```

## Project layout

```
aubade/
├── bin/aubade.js            # CLI entry
├── src/
│   ├── index.js             # orchestration
│   ├── aggregators/         # collect signals from your world
│   ├── script/              # prompt + LLM + rubric
│   ├── tts/                 # OpenAI + Kokoro providers
│   ├── memory/              # SQLite store
│   ├── play/                # cross-platform audio playback
│   └── cli/                 # Ink TUI (no build step)
├── test/                    # vitest, 21 tests
├── landing/                 # single-file marketing page + sample.mp3
├── CLAUDE.md                # vision & principles
├── codex.md                 # full handoff doc
└── README.md                # this file
```

## Roadmap

- [ ] `npm publish` under the `aubade` name
- [ ] Deploy landing page to `aubade.dev`
- [ ] **Feedback loops** — verify commitment completion by checking target repo for commits at T+90; `--rate` flag
- [ ] **Audrey integration** — replace local SQLite with [Audrey](https://github.com/Evilander/Audrey) biological memory
- [ ] **Streaming TTS** for faster time-to-first-audio
- [ ] **Weekly digest** — longer-form Monday broadcast summarizing the past seven days
- [ ] **Team mode** — aggregate across multiple authors for engineering managers

See [`codex.md`](codex.md) for the full technical handoff and open tasks.

## Design principles

1. **Audio-first.** Start your day with headphones in and eyes closed. The terminal UI is decorative.
2. **Local-first.** Your git logs and project folders never leave your machine. Only a short prompt goes to the LLM.
3. **Literary voice.** No "Good morning, Tyler!" No "Here are your 7 priorities." No emojis. The opening line is an observation, not a salutation.
4. **Memory is structural.** Yesterday's broadcast is context for today's. Over a week, patterns emerge.
5. **Ships as a real artifact.** `npx aubade` works on day one. No build step. No Docker. No backend.

## Acknowledgments

Built as part of the Genesis superskill run on 2026-04-16 in Quincy, Illinois. Uses [Ink](https://github.com/vadimdemedes/ink) for the TUI, [suncalc](https://github.com/mourner/suncalc) for dawn math, [kokoro-js](https://github.com/hexgrad/kokoro) for local voice synthesis, and the epigraph canon of anyone from Thoreau to Wordsworth to Marcus Aurelius.

## License

[MIT](LICENSE) — Tyler Eveland, 2026.

---

<div align="center">
<em>Built for solo operators.&nbsp;&nbsp;Local-first.&nbsp;&nbsp;Literary.</em><br>
<sub>— Eveland Digital, 2026</sub>
</div>
