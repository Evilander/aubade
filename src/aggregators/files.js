import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';

const TEXT_EXT = new Set(['.md', '.txt', '.markdown', '.note']);

function ext(name) {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i).toLowerCase();
}

async function walkNotes(dir, sinceMs, depth = 3) {
  const notes = [];
  const queue = [[dir, 0]];
  while (queue.length) {
    const [current, level] = queue.shift();
    if (level > depth) continue;
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push([full, level + 1]);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!TEXT_EXT.has(ext(entry.name))) continue;
      try {
        const s = await stat(full);
        if (s.mtimeMs < sinceMs) continue;
        const raw = await readFile(full, 'utf8');
        const firstLine = raw.split('\n').find(l => l.trim()) || '';
        notes.push({
          path: full,
          name: entry.name,
          mtime: s.mtimeMs,
          preview: firstLine.replace(/^#+\s*/, '').slice(0, 140),
          bytes: raw.length
        });
      } catch {}
    }
  }
  notes.sort((a, b) => b.mtime - a.mtime);
  return notes.slice(0, 10);
}

export async function collectNotes({ notesDir = null, sinceHours = 48 } = {}) {
  if (!notesDir) return { kind: 'notes', entries: [] };
  const since = Date.now() - sinceHours * 3600 * 1000;
  const entries = await walkNotes(notesDir, since);
  return { kind: 'notes', entries };
}
