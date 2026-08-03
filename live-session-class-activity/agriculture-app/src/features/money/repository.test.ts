import { describe, expect, it } from '@jest/globals';

import { getBalanceCents } from './repository';

describe('ledger balance', () => {
  it('returns the SQL-derived balance from the income-minus-expense aggregate', async () => {
    const queries: string[] = [];
    const db = { getFirstAsync: async (query: string) => { queries.push(query); return { balance: 2350 }; } } as never;

    await expect(getBalanceCents(db)).resolves.toBe(2350);
    expect(queries[0]).toContain("CASE WHEN kind = 'income'");
  });
});
