import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../src/script/prompt.js';

const sampleSignals = {
  clock: {
    kind: 'clock',
    spoken: 'Thursday, April 16th',
    year: 2026,
    sunriseSpoken: '6:14 a.m.',
    season: 'spring',
    day: 16
  },
  git: {
    kind: 'git',
    reposScanned: 12,
    reposActive: 2,
    totalCommits: 5,
    activity: [
      { repo: 'audrey', commits: [
        { hash: 'abc123', subject: 'add memory reconsolidation', timestamp: Date.now() - 3600_000 },
        { hash: 'def456', subject: 'fix vec index on cold start', timestamp: Date.now() - 7200_000 }
      ] }
    ]
  },
  projects: {
    kind: 'projects',
    touched: [
      { name: 'audrey', path: 'B:/x/audrey', lastTouched: Date.now() - 3600_000, filesChanged: 8 }
    ],
    cold: [
      { name: 'genesis-prism', staleDays: 14, lastTouched: Date.now() - 14 * 86400_000 }
    ]
  },
  notes: { kind: 'notes', entries: [] }
};

describe('buildPrompt', () => {
  it('builds a system prompt that forbids corporate cheerfulness', () => {
    const { system } = buildPrompt({ signals: sampleSignals, durationSeconds: 180 });
    expect(system).toMatch(/No "Good morning/);
    expect(system).toMatch(/No corporate cheerfulness/);
    expect(system).toMatch(/JSON/);
  });

  it('includes signal data in the user message', () => {
    const { user } = buildPrompt({ signals: sampleSignals });
    expect(user).toMatch(/Thursday, April 16th/);
    expect(user).toMatch(/audrey/);
    expect(user).toMatch(/memory reconsolidation/);
    expect(user).toMatch(/genesis-prism/);
  });

  it('flags first broadcast when there is no yesterday', () => {
    const { user } = buildPrompt({ signals: sampleSignals, yesterday: null });
    expect(user).toMatch(/first one|No prior broadcast/i);
  });

  it('references yesterday when present', () => {
    const { user } = buildPrompt({
      signals: sampleSignals,
      yesterday: {
        openingLine: 'The fog was on the river.',
        commitment: 'finish the landing page',
        script: 'yesterday full script'
      }
    });
    expect(user).toMatch(/The fog was on the river/);
    expect(user).toMatch(/finish the landing page/);
  });

  it('selects an epigraph deterministically by date', () => {
    const first = buildPrompt({ signals: sampleSignals }).epigraph;
    const second = buildPrompt({ signals: sampleSignals }).epigraph;
    expect(first.text).toBe(second.text);
    expect(first.attrib).toBeDefined();
  });
});
