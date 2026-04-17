import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

const run = promisify(execFile);

async function isGitRepo(dir) {
  try {
    const s = await stat(join(dir, '.git'));
    return s.isDirectory() || s.isFile();
  } catch {
    return false;
  }
}

async function findRepos(root, depth = 3) {
  const repos = [];
  const queue = [[root, 0]];
  while (queue.length) {
    const [dir, level] = queue.shift();
    if (level > depth) continue;
    if (await isGitRepo(dir)) {
      repos.push(dir);
      continue;
    }
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      queue.push([join(dir, entry.name), level + 1]);
    }
  }
  return repos;
}

async function logSince(repo, sinceHours) {
  try {
    const { stdout } = await run('git', [
      'log',
      `--since=${sinceHours} hours ago`,
      '--pretty=format:%h|%an|%ae|%s|%ct',
      '--no-merges',
      '--max-count=12'
    ], { cwd: repo, maxBuffer: 2 * 1024 * 1024 });
    if (!stdout.trim()) return [];
    return stdout.split('\n').map(line => {
      const [hash, author, email, subject, timestamp] = line.split('|');
      return { hash, author, email, subject, timestamp: Number(timestamp) * 1000 };
    });
  } catch {
    return [];
  }
}

export async function collectGit({ roots = [], sinceHours = 24, authorMatch = null } = {}) {
  const repos = [];
  for (const root of roots) {
    const found = await findRepos(root);
    repos.push(...found);
  }

  const activity = [];
  for (const repo of repos) {
    const commits = await logSince(repo, sinceHours);
    const mine = authorMatch
      ? commits.filter(c => c.email?.includes(authorMatch) || c.author?.includes(authorMatch))
      : commits;
    if (mine.length === 0) continue;
    const name = repo.split(/[\\/]/).pop();
    activity.push({ repo: name, path: repo, commits: mine });
  }

  activity.sort((a, b) => {
    const aLatest = Math.max(...a.commits.map(c => c.timestamp));
    const bLatest = Math.max(...b.commits.map(c => c.timestamp));
    return bLatest - aLatest;
  });

  return {
    kind: 'git',
    reposScanned: repos.length,
    reposActive: activity.length,
    totalCommits: activity.reduce((n, r) => n + r.commits.length, 0),
    activity: activity.slice(0, 6)
  };
}
