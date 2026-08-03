import { describe, expect, it } from '@jest/globals';

import { updateMarker, type MarkerInput } from './repository';

const equipmentInput: MarkerInput = {
  name: 'Tractor shed',
  kind: 'equipment',
  latitude: 35.2,
  longitude: -97.4,
  notes: '',
};

describe('map marker updates', () => {
  it('blocks reclassifying a field that still has crop cycles', async () => {
    const writes: unknown[][] = [];
    const db = {
      getFirstAsync: async (query: string) => query.includes('SELECT kind') ? { kind: 'field' } : { count: 1 },
      runAsync: async (...args: unknown[]) => { writes.push(args); return { changes: 1, lastInsertRowId: 1 }; },
    } as never;

    await expect(updateMarker(db, 3, equipmentInput)).rejects.toThrow('Remove this field’s crop cycles');
    expect(writes).toHaveLength(0);
  });

  it('allows reclassification when the field has no crop cycles', async () => {
    const writes: unknown[][] = [];
    const db = {
      getFirstAsync: async (query: string) => query.includes('SELECT kind') ? { kind: 'field' } : { count: 0 },
      runAsync: async (...args: unknown[]) => { writes.push(args); return { changes: 1, lastInsertRowId: 1 }; },
    } as never;

    await expect(updateMarker(db, 3, equipmentInput)).resolves.toBeUndefined();
    expect(writes).toHaveLength(1);
  });
});
