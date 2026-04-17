import { describe, it, expect } from 'vitest';
import { validateScript } from '../src/script/rubric.js';

describe('script rubric', () => {
  it('passes a clean script', () => {
    const verdict = validateScript({
      openingLine: 'Four commits to audrey last night.',
      script: 'The reconsolidation pass is in. It works. Termivibe has been shelved for two weeks. That is fine.\n\nOne thing today.',
      commitment: 'Finish the landing page. Ninety minutes.'
    });
    expect(verdict.ok).toBe(true);
    expect(verdict.problems).toHaveLength(0);
  });

  it('rejects banned flowery phrases', () => {
    const verdict = validateScript({
      openingLine: 'The quiet foyer of morning.',
      script: 'A pristine canvas awaits. Whispered promises tether the day together.',
      commitment: 'Finish the landing page. Ninety minutes.'
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(' ')).toMatch(/foyer|canvas|tether/i);
  });

  it('rejects vague commitment verbs', () => {
    const verdict = validateScript({
      openingLine: 'Clear sky.',
      script: 'Real work today.',
      commitment: 'Address the audrey backlog.'
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(' ')).toMatch(/vague verb/);
  });

  it('rejects commitments without a time box', () => {
    const verdict = validateScript({
      openingLine: 'Clear sky.',
      script: 'Real work today.',
      commitment: 'Finish the landing page.'
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(' ')).toMatch(/time box/);
  });

  it('rejects roll-call style', () => {
    const verdict = validateScript({
      openingLine: 'Numbers first.',
      script: 'Audrey saw 31 files changed. Automation saw 12 files changed. Github-ideas saw 8 files changed.',
      commitment: 'Finish the landing page. Ninety minutes.'
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(' ')).toMatch(/roll-call/);
  });

  it('flags long sentences', () => {
    const long = Array.from({ length: 25 }, () => 'word').join(' ') + '.';
    const verdict = validateScript({
      openingLine: 'Short.',
      script: `${long} ${long}`,
      commitment: 'Finish the landing page. Ninety minutes.'
    });
    expect(verdict.ok).toBe(false);
    expect(verdict.problems.join(' ')).toMatch(/too long/);
  });
});
