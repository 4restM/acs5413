import { describe, expect, it } from '@jest/globals';

import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('formats cents, thousands, and negative balances', () => {
    expect(formatCurrency(0)).toBe('$0.00');
    expect(formatCurrency(123456)).toBe('$1,234.56');
    expect(formatCurrency(-425)).toBe('-$4.25');
  });
});
