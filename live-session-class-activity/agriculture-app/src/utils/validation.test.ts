import { describe, expect, it } from '@jest/globals';

import { isValidDate, parseCoordinate, parseCurrencyToCents, parseNonNegativeQuantity, parseYear, requiredText } from './validation';

describe('form validation', () => {
  it('normalizes required text and rejects blank values', () => {
    expect(requiredText('  Corn seed  ', 'Supply name')).toBe('Corn seed');
    expect(() => requiredText('   ', 'Supply name')).toThrow('Supply name is required.');
  });

  it('accepts zero inventory quantity and rejects negative or nonnumeric quantities', () => {
    expect(parseNonNegativeQuantity('0')).toBe(0);
    expect(parseNonNegativeQuantity('2.5')).toBe(2.5);
    expect(() => parseNonNegativeQuantity('-1')).toThrow('zero or greater');
    expect(() => parseNonNegativeQuantity('bags')).toThrow('zero or greater');
    expect(() => parseNonNegativeQuantity('')).toThrow('zero or greater');
  });

  it('rejects a blank map coordinate instead of treating it as zero', () => {
    expect(() => parseCoordinate('', 'Latitude')).toThrow('Latitude must be between -90 and 90.');
  });

  it('converts valid currency strings to positive integer cents', () => {
    expect(parseCurrencyToCents('12')).toBe(1200);
    expect(parseCurrencyToCents('12.5')).toBe(1250);
    expect(parseCurrencyToCents('12.50')).toBe(1250);
    expect(() => parseCurrencyToCents('12.999')).toThrow('two decimal places');
    expect(() => parseCurrencyToCents('0')).toThrow('greater than zero');
  });

  it('validates calendar dates and bounded crop years', () => {
    expect(isValidDate('2026-02-28')).toBe(true);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(parseYear('2026')).toBe(2026);
    expect(() => parseYear('1899')).toThrow('between 1900 and 2100');
  });
});
