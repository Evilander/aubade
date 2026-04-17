import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('memory store', () => {
  let tempHome;

  beforeEach(async () => {
    tempHome = mkdtempSync(join(tmpdir(), 'aubade-test-'));
    process.env.AUBADE_HOME = tempHome;
    vi.resetModules();
  });

  afterEach(async () => {
    const { closeStore } = await import('../src/memory/store.js');
    closeStore();
    rmSync(tempHome, { recursive: true, force: true });
    delete process.env.AUBADE_HOME;
  });

  it('saves and retrieves an aubade by date', async () => {
    const store = await import('../src/memory/store.js');
    await store.saveAubade({
      date: '2026-04-15',
      openingLine: 'The fog was on the river.',
      script: 'full script here',
      commitment: 'finish the page',
      moodTag: 'clear',
      signals: { foo: 'bar' },
      durationSeconds: 180
    });

    const y = await store.getYesterday(new Date('2026-04-16T12:00:00Z'));
    expect(y).toBeTruthy();
    expect(y.openingLine).toBe('The fog was on the river.');
    expect(y.commitment).toBe('finish the page');
  });

  it('upserts on duplicate date', async () => {
    const store = await import('../src/memory/store.js');
    await store.saveAubade({
      date: '2026-04-15',
      openingLine: 'one',
      script: 's1',
      commitment: 'c1'
    });
    await store.saveAubade({
      date: '2026-04-15',
      openingLine: 'two',
      script: 's2',
      commitment: 'c2'
    });
    const rows = await store.listRecent(5);
    expect(rows.length).toBe(1);
    expect(rows[0].openingLine).toBe('two');
  });

  it('returns null when no prior aubade exists', async () => {
    const store = await import('../src/memory/store.js');
    const y = await store.getYesterday(new Date('2026-04-16T12:00:00Z'));
    expect(y).toBeNull();
  });
});
