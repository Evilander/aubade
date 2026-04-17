import Database from 'better-sqlite3';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS aubades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  opening_line TEXT NOT NULL,
  script TEXT NOT NULL,
  commitment TEXT NOT NULL,
  mood_tag TEXT,
  audio_path TEXT,
  signals_json TEXT,
  duration_seconds INTEGER,
  listened_seconds INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_aubades_date ON aubades (date DESC);
`;

let _db = null;

export async function getHome() {
  const configured = process.env.AUBADE_HOME;
  if (configured) return configured;
  return join(homedir(), '.aubade');
}

export async function openStore() {
  if (_db) return _db;
  const home = await getHome();
  await mkdir(home, { recursive: true });
  await mkdir(join(home, 'audio'), { recursive: true });
  const dbPath = join(home, 'aubade.db');
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.exec(SCHEMA);
  _db = db;
  return db;
}

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function saveAubade(record) {
  const db = await openStore();
  const stmt = db.prepare(`
    INSERT INTO aubades (date, opening_line, script, commitment, mood_tag, audio_path, signals_json, duration_seconds, created_at)
    VALUES (@date, @openingLine, @script, @commitment, @moodTag, @audioPath, @signalsJson, @durationSeconds, @createdAt)
    ON CONFLICT(date) DO UPDATE SET
      opening_line = excluded.opening_line,
      script = excluded.script,
      commitment = excluded.commitment,
      mood_tag = excluded.mood_tag,
      audio_path = excluded.audio_path,
      signals_json = excluded.signals_json,
      duration_seconds = excluded.duration_seconds,
      created_at = excluded.created_at
  `);
  stmt.run({
    date: record.date || isoDate(),
    openingLine: record.openingLine,
    script: record.script,
    commitment: record.commitment,
    moodTag: record.moodTag || 'clear',
    audioPath: record.audioPath || null,
    signalsJson: JSON.stringify(record.signals || {}),
    durationSeconds: record.durationSeconds || 0,
    createdAt: Date.now()
  });
}

export async function getYesterday(now = new Date()) {
  const db = await openStore();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const targetDate = isoDate(yesterday);
  const row = db.prepare(`
    SELECT opening_line AS openingLine, script, commitment, mood_tag AS moodTag, date
    FROM aubades
    WHERE date <= ?
    ORDER BY date DESC
    LIMIT 1
  `).get(targetDate);
  return row || null;
}

export async function listRecent(limit = 7) {
  const db = await openStore();
  return db.prepare(`
    SELECT id, date, opening_line AS openingLine, commitment, mood_tag AS moodTag, audio_path AS audioPath
    FROM aubades
    ORDER BY date DESC
    LIMIT ?
  `).all(limit);
}

export async function markListened(date, listenedSeconds) {
  const db = await openStore();
  db.prepare('UPDATE aubades SET listened_seconds = ? WHERE date = ?').run(listenedSeconds, date);
}

export function closeStore() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
