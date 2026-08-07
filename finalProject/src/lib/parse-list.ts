import { normalizeCardName } from '@/lib/normalize';
import type { CardListEntry } from '@/types/card';

const LIST_LINE_PATTERN = /^(?:(\d+)x?\s+)?(.+?)(?:\s+\(([A-Za-z0-9]{3,6})\))?(?:\s+(\S+))?\s*$/;
const SECTION_HEADERS = new Set(['deck', 'sideboard', 'commander', 'about']);
const TRAILING_FOIL_MARKER = /\s+\*(?:F|E)\*\s*$/i;

export type ParseCardListResult = {
  cards: CardListEntry[];
  skippedLines: { lineNumber: number; text: string }[];
};

export function parseCardList(input: string): ParseCardListResult {
  const cardsByKey = new Map<string, CardListEntry>();
  const skippedLines: ParseCardListResult['skippedLines'] = [];

  input.split(/\r?\n/).forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = rawLine.trim().replace(TRAILING_FOIL_MARKER, '').trim();
    const possibleHeader = line.replace(/:$/, '').toLowerCase();

    if (!line || line.startsWith('//') || SECTION_HEADERS.has(possibleHeader)) {
      return;
    }

    const match = line.match(LIST_LINE_PATTERN);
    if (!match) {
      skippedLines.push({ lineNumber, text: rawLine });
      return;
    }

    // No quantity means one copy.
    const qty = match[1] ? Number.parseInt(match[1], 10) : 1;
    let name = match[2].trim();
    const setCode = match[3]?.toUpperCase();
    let collectorNumber: string | undefined = match[4];

    // Without a set code, the last match belongs to the card name.
    if (!setCode && collectorNumber) {
      name = `${name} ${collectorNumber}`;
      collectorNumber = undefined;
    }

    // Skip anything that cannot become a valid Firebase key.
    const cardKey = normalizeCardName(name);
    if (!cardKey || !Number.isFinite(qty) || qty < 1) {
      skippedLines.push({ lineNumber, text: rawLine });
      return;
    }

    // Merge duplicate cards and keep their original line numbers.
    const existing = cardsByKey.get(cardKey);
    if (existing) {
      existing.qty += qty;
      existing.sourceLines.push(lineNumber);
      return;
    }

    cardsByKey.set(cardKey, {
      cardKey,
      name,
      qty,
      setCode,
      collectorNumber,
      sourceLines: [lineNumber],
    });
  });

  return { cards: [...cardsByKey.values()], skippedLines };
}
