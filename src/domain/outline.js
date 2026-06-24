export const getHeadingSections = (markdown) => {
  const headings = [...markdown.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((match) => ({
    level: match[1].length,
    text: match[2].trim(),
    start: match.index,
    heading: match[0],
  }));

  return headings.map((heading, index) => {
    let end = markdown.length;
    for (let cursor = index + 1; cursor < headings.length; cursor += 1) {
      if (headings[cursor].level <= heading.level) {
        end = headings[cursor].start;
        break;
      }
    }
    return {
      ...heading,
      end,
      index,
      block: markdown.slice(heading.start, end).replace(/\s+$/, ""),
    };
  });
};

export const getHeadingSectionKeys = (sections, slugify) => {
  const counts = new Map();
  return sections.map((section) => {
    const base = slugify(section.heading || section.text || "seccion") || "seccion";
    const nextCount = (counts.get(base) || 0) + 1;
    counts.set(base, nextCount);
    return nextCount === 1 ? base : `${base}-${nextCount}`;
  });
};

export const findHeadingSectionByLine = (doc, lineFrom) => {
  const sections = getHeadingSections(doc.toString());
  return sections.find((section) => {
    const line = doc.lineAt(section.start);
    return line.from === lineFrom;
  });
};

export const getHeadingFoldRange = (state, lineStart) => {
  const line = state.doc.lineAt(lineStart);
  const match = line.text.match(/^(#{1,6})\s+(.+)$/);
  if (!match) return null;
  const section = findHeadingSectionByLine(state.doc, line.from);
  if (!section) return null;

  const from = line.to;
  const to = section.end >= state.doc.length ? state.doc.length : Math.max(from, section.end - 1);
  return to > from ? { from, to } : null;
};

export const moveHeadingSectionMarkdown = (markdown, sourceIndex, targetIndex) => {
  const sections = getHeadingSections(markdown);
  if (sourceIndex === targetIndex || !sections[sourceIndex] || !sections[targetIndex]) return markdown;

  const source = sections[sourceIndex];
  const target = sections[targetIndex];
  const segment = markdown.slice(source.start, source.end);
  const removed = markdown.slice(0, source.start) + markdown.slice(source.end);
  const insertionPoint = source.start < target.start ? target.start - segment.length : target.start;
  return `${removed.slice(0, insertionPoint).replace(/\s*$/, "")}\n\n${segment.trim()}\n\n${removed.slice(insertionPoint).replace(/^\s*/, "")}`.trim();
};
