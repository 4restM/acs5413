export const MARKER_KINDS = ['field', 'equipment', 'storage', 'other'] as const;
export type MarkerKind = (typeof MARKER_KINDS)[number];

export const CROP_STATUSES = ['planned', 'growing', 'complete'] as const;
export type CropStatus = (typeof CROP_STATUSES)[number];

export const CASH_KINDS = ['income', 'expense'] as const;
export type CashKind = (typeof CASH_KINDS)[number];

export function requiredText(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} is required.`);
  return trimmed;
}

export function parseCoordinate(value: string | number, label: 'Latitude' | 'Longitude') {
  const normalized = typeof value === 'number' ? value : value.trim();
  const numberValue = typeof normalized === 'number' ? normalized : normalized === '' ? Number.NaN : Number(normalized);
  const limit = label === 'Latitude' ? 90 : 180;
  if (!Number.isFinite(numberValue) || numberValue < -limit || numberValue > limit) {
    throw new Error(`${label} must be between ${-limit} and ${limit}.`);
  }
  return numberValue;
}

export function parseNonNegativeQuantity(value: string | number) {
  const normalized = typeof value === 'number' ? value : value.trim();
  const numberValue = typeof normalized === 'number' ? normalized : normalized === '' ? Number.NaN : Number(normalized);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    throw new Error('Quantity must be a number that is zero or greater.');
  }
  return numberValue;
}

export function parseYear(value: string | number) {
  const year = typeof value === 'number' ? value : Number(value.trim());
  if (!Number.isInteger(year) || year < 1900 || year > 2100) {
    throw new Error('Year must be a whole number between 1900 and 2100.');
  }
  return year;
}

export function parseCurrencyToCents(value: string) {
  const normalized = value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error('Amount must be a positive number with no more than two decimal places.');
  }
  const [whole, fraction = ''] = normalized.split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  if (!Number.isSafeInteger(cents) || cents <= 0) {
    throw new Error('Amount must be greater than zero.');
  }
  return cents;
}

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function requireDate(value: string) {
  if (!isValidDate(value)) throw new Error('Date must use the YYYY-MM-DD format.');
  return value;
}

export function isMarkerKind(value: string): value is MarkerKind {
  return MARKER_KINDS.includes(value as MarkerKind);
}

export function isCropStatus(value: string): value is CropStatus {
  return CROP_STATUSES.includes(value as CropStatus);
}

export function isCashKind(value: string): value is CashKind {
  return CASH_KINDS.includes(value as CashKind);
}

export function userMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
}

export function fieldError(error: string | null, ...matches: string[]) {
  if (!error) return undefined;
  const normalized = error.toLowerCase();
  return matches.some((match) => normalized.includes(match.toLowerCase())) ? error : undefined;
}
