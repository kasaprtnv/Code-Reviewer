export type AnnotatedLine = {
  side: 'RIGHT' | 'LEFT';
  line: number;
  text: string;
  kind: '+' | '-' | ' ';
};

export function annotateUnifiedPatch(patch: string): AnnotatedLine[] {
  const lines = patch.split('\n');
  const out: AnnotatedLine[] = [];

  let oldLine = 0;
  let newLine = 0;

  for (const raw of lines) {
    const hunk = raw.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
    if (hunk) {
      oldLine = Number(hunk[1]);
      newLine = Number(hunk[2]);
      continue;
    }

    const prefix = raw[0] as '+' | '-' | ' ' | undefined;
    if (prefix !== '+' && prefix !== '-' && prefix !== ' ') continue;

    const text = raw.slice(1);

    if (prefix === '+') {
      out.push({ side: 'RIGHT', line: newLine, text, kind: '+' });
      newLine += 1;
    } else if (prefix === '-') {
      out.push({ side: 'LEFT', line: oldLine, text, kind: '-' });
      oldLine += 1;
    } else {
      out.push({ side: 'RIGHT', line: newLine, text, kind: ' ' });
      oldLine += 1;
      newLine += 1;
    }
  }
  return out;
}

export function buildRightSidePromptLines(patch?: string): string {
  const annotated = annotateUnifiedPatch(patch ?? '');
  return annotated
    .filter((l) => l.side === 'RIGHT' && (l.kind === '+' || l.kind === ' '))
    .map((l) => `R${l.line}: ${l.text}`)
    .join('\n');
}
