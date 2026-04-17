import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const SKIP = new Set(['node_modules', '.git', '.next', 'dist', 'build', '__pycache__', '.venv', 'venv', 'target', '.cache']);

async function recentActivity(dir, { maxDepth = 2, since }) {
  let newest = 0;
  let fileCount = 0;
  const queue = [[dir, 0]];
  while (queue.length) {
    const [current, level] = queue.shift();
    if (level > maxDepth) continue;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        if (SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
        queue.push([full, level + 1]);
        continue;
      }
      if (!entry.isFile()) continue;
      try {
        const s = await stat(full);
        if (s.mtimeMs > newest) newest = s.mtimeMs;
        if (s.mtimeMs > since) fileCount += 1;
      } catch {}
    }
  }
  return { newest, fileCount };
}

export async function collectProjects({ roots = [], sinceHours = 168 } = {}) {
  const cutoff = Date.now() - sinceHours * 3600 * 1000;
  const touched = [];
  const cold = [];

  for (const root of roots) {
    let dirs;
    try {
      dirs = await readdir(root, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of dirs) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('_archive')) continue;
      if (entry.name.startsWith('.')) continue;
      const path = join(root, entry.name);
      const { newest, fileCount } = await recentActivity(path, { since: cutoff });
      if (newest === 0) continue;
      const entrySummary = { name: entry.name, path, lastTouched: newest, filesChanged: fileCount };
      if (newest > cutoff) {
        touched.push(entrySummary);
      } else {
        const staleDays = Math.round((Date.now() - newest) / 86_400_000);
        cold.push({ ...entrySummary, staleDays });
      }
    }
  }

  touched.sort((a, b) => b.lastTouched - a.lastTouched);
  cold.sort((a, b) => b.lastTouched - a.lastTouched);

  return {
    kind: 'projects',
    touched: touched.slice(0, 8),
    cold: cold.slice(0, 6),
    scannedRoots: roots
  };
}
