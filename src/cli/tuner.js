import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

const e = React.createElement;

function Dial({ position }) {
  const width = 40;
  const pos = Math.max(0, Math.min(width - 1, Math.floor(position * width)));
  const bar = Array.from({ length: width }, (_, i) => i === pos ? '▼' : '─').join('');
  const ticks = Array.from({ length: width }, (_, i) => (i % 5 === 0 ? '│' : ' ')).join('');
  return e(Box, { flexDirection: 'column' },
    e(Text, { color: 'yellow' }, '  ' + bar),
    e(Text, { color: 'gray' }, '  ' + ticks)
  );
}

function Speaker({ pulse }) {
  const frames = ['  )', ' ))', '))) ', ' )) '];
  return e(Text, { color: 'yellowBright' }, frames[pulse % frames.length]);
}

export default function Tuner({ date, mood, frequency = 88.3, callSign = 'AUB', playing = false }) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => setPulse(p => p + 1), 250);
    return () => clearInterval(t);
  }, [playing]);

  const position = Math.max(0, Math.min(1, (frequency - 88.0) / 20.0));

  return e(Box, {
      flexDirection: 'column',
      paddingX: 2,
      paddingY: 1,
      borderStyle: 'round',
      borderColor: 'yellow'
    },
    e(Box, { justifyContent: 'space-between' },
      e(Text, { bold: true, color: 'yellowBright' }, `W — ${callSign}`),
      e(Text, { color: 'yellow' }, `${frequency.toFixed(1)} FM`),
      e(Text, { color: 'yellowBright' }, '◉ ON AIR')
    ),
    e(Box, { marginY: 1 },
      e(Dial, { position })
    ),
    e(Box, { justifyContent: 'space-between' },
      e(Text, { dimColor: true }, date || ''),
      e(Text, { dimColor: true }, `mood: ${mood || 'clear'}`),
      e(Box, null, e(Speaker, { pulse }))
    )
  );
}
