import { describe, expect, it } from '@jest/globals';

import { createSupply, updateSupply, type SupplyInput } from './repository';

describe('inventory repository', () => {
  it('does not write an invalid supply form', async () => {
    const calls: unknown[][] = [];
    const db = { runAsync: async (...args: unknown[]) => { calls.push(args); return { changes: 1, lastInsertRowId: 1 }; } } as never;
    const input: SupplyInput = { name: 'Seed', category: 'Planting', unit: 'bags', quantity: '-1' };

    await expect(createSupply(db, input)).rejects.toThrow('zero or greater');
    expect(calls).toHaveLength(0);
  });

  it('writes a normalized valid supply form', async () => {
    const calls: unknown[][] = [];
    const db = { runAsync: async (...args: unknown[]) => { calls.push(args); return { changes: 1, lastInsertRowId: 4 }; } } as never;
    const input: SupplyInput = { name: '  Seed  ', category: ' Planting ', unit: ' bags ', quantity: '2.5' };

    await createSupply(db, input);

    expect(calls).toHaveLength(1);
    expect(calls[0]?.slice(1, 5)).toEqual(['Seed', 'Planting', 'bags', 2.5]);
  });

  it('preserves the caller draft when a repository save fails', async () => {
    const db = { runAsync: async () => { throw new Error('database unavailable'); } } as never;
    const draft: SupplyInput = { name: 'Fertilizer', category: 'Soil', unit: 'lb', quantity: '10' };

    await expect(updateSupply(db, 7, draft)).rejects.toThrow('database unavailable');
    expect(draft).toEqual({ name: 'Fertilizer', category: 'Soil', unit: 'lb', quantity: '10' });
  });
});
