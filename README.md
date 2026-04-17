# aubade

> *n.* a morning song; a poem or lyric about lovers parting at dawn.

A three-minute, voice-narrated morning radio broadcast about your life.

Your overnight commits, your cold projects, yesterday's commitment, today's one thing — read aloud in a voice that isn't trying to sell you anything. Thirty seconds of setup, three minutes of listening, ninety minutes of focused work. That's the whole contract.

```bash
npx aubade
```

## What it does

Every morning, `aubade` walks your drives, reads your git log, notices which projects you've touched and which ones are going cold, remembers yesterday's broadcast, and writes a short spoken piece. Then it plays it. The tone is Ira Glass crossed with Marilynne Robinson — specific, dry, a little literary, never corporate.

It ends with one commitment. Just one. Verb-first. Ninety minutes. Go.

## Install

### Run once, no install

```bash
OPENAI_API_KEY=sk-... npx aubade
```

### Install globally

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
node bin/aubade.js
```

## Configuration

Aubade needs one API key. Everything else is optional.

```bash
# Required — pick one
ANTHROPIC_API_KEY=sk-ant-...       # preferred, better prose
# OPENAI_API_KEY=sk-...             # fallback

# Optional — text-to-speech (default: openai TTS)
OPENAI_API_KEY=sk-...               # also used for voice if set
AUBADE_TTS=openai                   # or: kokoro (offline, local model)
AUBADE_VOICE=nova                   # openai voice name

# Optional — where to scan for git + project activity
AUBADE_ROOTS=B:/projects,A:/ai      # comma-separated roots
AUBADE_AUTHOR=your-email-or-name    # filter commits by author

# Optional — script length and location
AUBADE_DURATION_SECONDS=180         # target script length
AUBADE_LAT=39.9                     # for sunrise; default Quincy, IL
AUBADE_LON=-91.4
AUBADE_OPERATOR=Tyler               # your name, used sparingly
AUBADE_HOME=                        # where to store memory (default: ~/.aubade)
```

Drop these in a `.env` file next to the binary, or export them in your shell profile.

## Commands

```bash
aubade                    # generate and play today's aubade
aubade --text-only        # script only, no audio
aubade --dry-run          # no API calls, no audio — just renders a sample
aubade --plain            # plain text output, no TUI (useful in scripts/cron)
aubade --recent 7         # list the last seven broadcasts
```

## Scheduling

### macOS / Linux (cron)

```cron
30 6 * * 1-5 /usr/local/bin/aubade > ~/.aubade/log 2>&1
```

### Windows (Task Scheduler, PowerShell)

```powershell
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c npx aubade"
$trigger = New-ScheduledTaskTrigger -Daily -At 6:30am
Register-ScheduledTask -TaskName "Aubade" -Action $action -Trigger $trigger
```

## The design

- **Audio-first.** You should be able to start your day with headphones in and eyes closed. The terminal UI is decorative.
- **Local-first.** Your git logs, project folders, and notes never leave your machine. Only the short prompt that generates the script leaves — and only if you're using a hosted LLM.
- **Literary voice.** No "Good morning, Tyler!" No "Here are your 7 priorities." No emojis. The opening line is an observation, not a salutation.
- **Memory is structural.** Yesterday's broadcast is context for today's. Over a week, patterns emerge. Over a month, the host starts to sound like it knows you.
- **Runnable as a real artifact.** `npx aubade` works on day one. No build step. No Docker. No backend.

## How it works

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ aggregators/    │     │ script/          │     │ tts/             │
│  git            │ ──→ │  prompt.js       │ ──→ │  openai.js       │
│  projects       │     │  generate.js     │     │  kokoro.js       │
│  notes          │     │   (Claude/GPT)   │     │                  │
│  clock          │     └──────────────────┘     └──────────────────┘
└─────────────────┘              │                        │
        │                         │                        ▼
        │                         │                ┌──────────────┐
        │                         │                │ ~/.aubade/   │
        │                         │                │   audio/     │
        │                         ▼                │   *.mp3      │
        │              ┌──────────────────┐        └──────────────┘
        └─────────────→│ memory/          │                │
                       │   aubade.db      │                ▼
                       │   (sqlite)       │      ┌──────────────────┐
                       └──────────────────┘      │ play/audio.js    │
                                │                │ (cross-platform) │
                                ▼                └──────────────────┘
                     yesterday becomes context
                     for tomorrow's prompt
```

## Tests

```bash
npm test
```

Fifteen tests across aggregators, prompt formatting, and store round-tripping. Audio and LLM calls are not tested in CI — too expensive, and the LLM is the interesting part.

## Why this exists

I have sixty-something project folders on two drives. Most of them are half-finished. Some are good. All of them compete for attention every morning. A Notion page doesn't help. A todo app doesn't help. What helps, a little, is a patient voice that says *you wrote four commits to audrey last night, the landing page is still undone, that's the thing for the next ninety minutes.*

Aubade is that voice.

## License

MIT — see LICENSE.
