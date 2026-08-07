const COMBINING_MARKS = /[\u0300-\u036f]/g;

// Firebase keys cannot contain these characters, so strip them from card names.
const RTDB_ILLEGAL_KEY_CHARACTERS = /[.$#[\]\/]/g;

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
