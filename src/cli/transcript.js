import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';

const e = React.createElement;

function computeVisibleText(fullText, durationSeconds, startedAt) {
  if (!startedAt) return '';
  const elapsed = (Date.now() - startedAt) / 1000;
  const progress = Math.max(0, Math.min(1, elapsed / durationSeconds));
  const charsToShow = Math.floor(fullText.length * progress);
  return fullText.slice(0, charsToShow);
}

export default function Transcript({ script, durationSeconds = 180, startedAt, openingLine, epigraph, commitment }) {
  const [visible, setVisible] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!startedAt) return;
    setDone(false);
    const tick = () => {
      const next = computeVisibleText(script, durationSeconds, startedAt);
      setVisible(next);
      if (next.length >= script.length) setDone(true);
    };
    tick();
    const t = setInterval(tick, 140);
    return () => clearInterval(t);
  }, [script, durationSeconds, startedAt]);

  const lines = visible.split('\n');

  const epigraphBlock = epigraph
    ? e(Box, { marginBottom: 1, flexDirection: 'column' },
        e(Text, { italic: true, color: 'gray' }, `  "${epigraph.text}"`),
        e(Text, { dimColor: true }, `     — ${epigraph.attrib}`)
      )
    : null;

  const openingBlock = openingLine
    ? e(Box, { marginBottom: 1 },
        e(Text, { bold: true, color: 'yellow' }, `› ${openingLine}`)
      )
    : null;

  const commitmentBlock = (done && commitment)
    ? e(Box, {
        marginTop: 1,
        borderStyle: 'single',
        borderColor: 'yellow',
        paddingX: 1
      },
        e(Text, { color: 'yellowBright' }, '  The one thing: '),
        e(Text, { color: 'white' }, commitment)
      )
    : null;

  return e(Box, { flexDirection: 'column', paddingX: 2, paddingY: 1 },
    epigraphBlock,
    openingBlock,
    ...lines.map((line, i) => e(Text, { key: i, color: 'white' }, `  ${line}`)),
    commitmentBlock
  );
}
