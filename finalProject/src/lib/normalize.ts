const COMBINING_MARKS = /[\u0300-\u036f]/g;
const RTDB_ILLEGAL_KEY_CHARACTERS = /[.$#[\]\/]/g;

/**
 * DISCUSSION POINT:
 * Produces the single canonical key used by imports, Firebase, and both sides
 * of a trade match. Changing this function changes the app's matching rules.
 */
export function normalizeCardName(cardName: string) {
  const frontFace = cardName.split(/\s*\/\/\s*/, 1)[0];

  return frontFace
    .replace(/Æ/g, 'AE')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(RTDB_ILLEGAL_KEY_CHARACTERS, '')
    .trim()
    .replace(/\s+/g, '-');
}
