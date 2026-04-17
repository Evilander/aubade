import { describe, it, expect } from 'vitest';
import { collectClock } from '../src/aggregators/clock.js';

describe('clock aggregator', () => {
  it('returns a structured object with kind "clock"', () => {
    const c = collectClock(new Date('2026-04-16T10:00:00Z'));
    expect(c.kind).toBe('clock');
    expect(c.dow).toBe('Thursday');
    expect(c.month).toBe('April');
    expect(c.day).toBe(16);
    expect(c.dayOrdinal).toBe('16th');
    expect(c.year).toBe(2026);
    expect(c.season).toBe('spring');
  });

  it('formats ordinals correctly at edge cases', () => {
    expect(collectClock(new Date('2026-04-01T12:00:00Z')).dayOrdinal).toBe('1st');
    expect(collectClock(new Date('2026-04-02T12:00:00Z')).dayOrdinal).toBe('2nd');
    expect(collectClock(new Date('2026-04-03T12:00:00Z')).dayOrdinal).toBe('3rd');
    expect(collectClock(new Date('2026-04-11T12:00:00Z')).dayOrdinal).toBe('11th');
    expect(collectClock(new Date('2026-04-21T12:00:00Z')).dayOrdinal).toBe('21st');
    expect(collectClock(new Date('2026-04-23T12:00:00Z')).dayOrdinal).toBe('23rd');
  });

  it('selects season by hemisphere', () => {
    const january = new Date('2026-01-15T12:00:00Z');
    expect(collectClock(january, 'N').season).toBe('winter');
    expect(collectClock(january, 'S').season).toBe('summer');
  });

  it('produces a speakable sunrise string', () => {
    const c = collectClock(new Date('2026-04-16T10:00:00Z'));
    expect(c.sunriseSpoken).toMatch(/a\.m\.|p\.m\./);
  });
});
