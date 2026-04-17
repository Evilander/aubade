import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync, mkdirSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { collectProjects } from '../src/aggregators/projects.js';

let root;

describe('projects aggregator', () => {
  beforeAll(() => {
    root = mkdtempSync(join(tmpdir(), 'aubade-proj-'));

    mkdirSync(join(root, 'hot-project'));
    writeFileSync(join(root, 'hot-project', 'a.txt'), 'x');

    mkdirSync(join(root, 'cold-project'));
    const coldFile = join(root, 'cold-project', 'b.txt');
    writeFileSync(coldFile, 'x');
    const oldTime = new Date(Date.now() - 30 * 86_400_000);
    utimesSync(coldFile, oldTime, oldTime);

    mkdirSync(join(root, '_archive_should_skip'));
    writeFileSync(join(root, '_archive_should_skip', 'c.txt'), 'x');
  });

  afterAll(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('identifies recently-touched projects', async () => {
    const result = await collectProjects({ roots: [root], sinceHours: 24 });
    expect(result.kind).toBe('projects');
    const names = result.touched.map(p => p.name);
    expect(names).toContain('hot-project');
  });

  it('reports cold projects', async () => {
    const result = await collectProjects({ roots: [root], sinceHours: 1 });
    const coldNames = result.cold.map(p => p.name);
    expect(coldNames).toContain('cold-project');
  });

  it('skips archived folders', async () => {
    const result = await collectProjects({ roots: [root], sinceHours: 24 });
    const allNames = [...result.touched, ...result.cold].map(p => p.name);
    expect(allNames).not.toContain('_archive_should_skip');
  });
});
