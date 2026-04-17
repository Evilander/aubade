import { collectClock } from './clock.js';
import { collectGit } from './git.js';
import { collectProjects } from './projects.js';
import { collectNotes } from './files.js';

export async function gatherSignals(config) {
  const roots = (config.roots || '').split(',').map(s => s.trim()).filter(Boolean);
  const author = config.author;
  const notesDir = config.notes || null;

  const [clock, git, projects, notes] = await Promise.all([
    Promise.resolve(collectClock()),
    collectGit({ roots, sinceHours: 24, authorMatch: author }),
    collectProjects({ roots, sinceHours: 168 }),
    collectNotes({ notesDir, sinceHours: 48 })
  ]);

  return { clock, git, projects, notes };
}
