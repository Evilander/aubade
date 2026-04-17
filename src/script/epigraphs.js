// A small canon of morning-appropriate opening lines the script generator can
// choose from or use as tonal anchors. Not all epigraphs get used; they seed
// voice, not content.

export const epigraphs = [
  { text: 'The first hour of the morning is the rudder of the day.', attrib: 'Henry Ward Beecher' },
  { text: "Morning doesn't come twice a day.", attrib: 'Proverb, Arabic' },
  { text: 'Every morning I wake and the world is a rumor.', attrib: 'after Jack Gilbert' },
  { text: 'There is no need to hurry. There is no need to sparkle. There is no need to be anybody but oneself.', attrib: 'Virginia Woolf' },
  { text: 'You must change your life.', attrib: 'Rainer Maria Rilke' },
  { text: 'It is a beautiful day for being alive and working.', attrib: 'overheard, Quincy, Illinois' },
  { text: 'The sun is but a morning star.', attrib: 'Henry David Thoreau' },
  { text: 'What we do in life echoes in eternity.', attrib: 'Marcus Aurelius' },
  { text: 'Start where you are. Use what you have. Do what you can.', attrib: 'Arthur Ashe' },
  { text: 'The present moment always will have been.', attrib: 'David Foster Wallace' },
  { text: 'A new day is a thin place between worlds.', attrib: 'Celtic saying' },
  { text: 'To begin, begin.', attrib: 'William Wordsworth' },
  { text: 'The river is everywhere.', attrib: 'Hermann Hesse' },
  { text: 'You can observe a lot by watching.', attrib: 'Yogi Berra' },
  { text: 'All that is gold does not glitter, not all those who wander are lost.', attrib: 'J.R.R. Tolkien' },
  { text: 'The smallest unit of meaningful progress is one morning.', attrib: 'Aubade, self-quoting' }
];

export function pickEpigraph(seed = Date.now()) {
  const i = Math.abs(Math.floor(seed)) % epigraphs.length;
  return epigraphs[i];
}
