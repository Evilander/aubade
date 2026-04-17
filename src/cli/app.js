import React, { useEffect, useState } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Tuner from './tuner.js';
import Transcript from './transcript.js';

const e = React.createElement;

export default function App({ aubade, onStart, onReplay, onExit, autoPlay = true }) {
  const { exit } = useApp();
  const [startedAt, setStartedAt] = useState(null);
  const [status, setStatus] = useState('ready');

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      onExit?.();
      exit();
    }
    if (input === ' ' && status === 'ready') {
      setStartedAt(Date.now());
      setStatus('playing');
      onStart?.();
    }
    if (input === 'r' && status === 'playing') {
      setStartedAt(Date.now());
      onReplay?.();
    }
  });

  useEffect(() => {
    if (!aubade || !autoPlay) return;
    const t = setTimeout(() => {
      setStartedAt(Date.now());
      setStatus('playing');
      onStart?.();
    }, 500);
    return () => clearTimeout(t);
  }, [aubade, autoPlay]);

  if (!aubade) {
    return e(Box, { flexDirection: 'column', padding: 2 },
      e(Text, { color: 'yellow' }, 'tuning in…')
    );
  }

  const { openingLine, script, commitment, epigraph, moodTag, durationSeconds, dateSpoken } = aubade;

  return e(Box, { flexDirection: 'column' },
    e(Tuner, {
      date: dateSpoken,
      mood: moodTag,
      frequency: 88.0 + ((dateSpoken?.length || 10) % 10),
      playing: status === 'playing'
    }),
    e(Transcript, {
      script,
      durationSeconds,
      startedAt,
      openingLine,
      epigraph,
      commitment
    }),
    e(Box, { paddingX: 2, paddingTop: 1 },
      e(Text, { dimColor: true }, '  space: play  ·  r: replay  ·  q: quit')
    )
  );
}
