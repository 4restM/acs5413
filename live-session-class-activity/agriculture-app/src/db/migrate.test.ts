import { describe, expect, it } from '@jest/globals';

import { migrateDatabase } from './migrate';

describe('database migration', () => {
  it('adds the field-reclassification trigger to an existing version-one database', async () => {
    const statements: string[] = [];
    const db = {
      execAsync: async (statement: string) => { statements.push(statement); },
      getFirstAsync: async () => ({ user_version: 1 }),
      runAsync: async () => ({ changes: 1, lastInsertRowId: 1 }),
    } as never;

    await migrateDatabase(db);

    expect(statements.some((statement) => statement.includes('prevent_field_marker_reclassification'))).toBe(true);
    expect(statements.some((statement) => statement.includes('PRAGMA user_version = 2'))).toBe(true);
  });
});
