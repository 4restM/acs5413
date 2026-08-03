import type { SQLiteDatabase } from 'expo-sqlite';

import { DEFAULT_FARM } from '@/constants/map';

const DATABASE_VERSION = 2;

export async function migrateDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = versionRow?.user_version ?? 0;

  if (version >= DATABASE_VERSION) return;

  if (version < 1) {
    await db.execAsync(`
    BEGIN TRANSACTION;
    CREATE TABLE IF NOT EXISTS farm_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      farm_name TEXT NOT NULL CHECK (length(trim(farm_name)) > 0),
      latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
      longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS map_markers (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      kind TEXT NOT NULL CHECK (kind IN ('field', 'equipment', 'storage', 'other')),
      latitude REAL NOT NULL CHECK (latitude BETWEEN -90 AND 90),
      longitude REAL NOT NULL CHECK (longitude BETWEEN -180 AND 180),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS supply_items (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL CHECK (length(trim(name)) > 0),
      category TEXT NOT NULL CHECK (length(trim(category)) > 0),
      unit TEXT NOT NULL CHECK (length(trim(unit)) > 0),
      quantity REAL NOT NULL CHECK (quantity >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS crop_cycles (
      id INTEGER PRIMARY KEY,
      field_marker_id INTEGER NOT NULL REFERENCES map_markers(id) ON DELETE RESTRICT,
      crop_name TEXT NOT NULL CHECK (length(trim(crop_name)) > 0),
      season TEXT NOT NULL CHECK (length(trim(season)) > 0),
      year INTEGER NOT NULL CHECK (year BETWEEN 1900 AND 2100),
      status TEXT NOT NULL CHECK (status IN ('planned', 'growing', 'complete')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS crop_cycles_field_year ON crop_cycles(field_marker_id, year DESC);
    CREATE TABLE IF NOT EXISTS cash_entries (
      id INTEGER PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('income', 'expense')),
      amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
      category TEXT NOT NULL CHECK (length(trim(category)) > 0),
      occurred_on TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS weather_cache (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      fetched_at TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );
    PRAGMA user_version = 1;
    COMMIT;
    `);

    await db.runAsync(
      `INSERT OR IGNORE INTO farm_settings (id, farm_name, latitude, longitude, updated_at)
       VALUES (1, ?, ?, ?, ?)`,
      DEFAULT_FARM.name,
      DEFAULT_FARM.latitude,
      DEFAULT_FARM.longitude,
      new Date().toISOString(),
    );
  }

  if (version < 2) {
    await db.execAsync(`
      BEGIN TRANSACTION;
      CREATE TRIGGER IF NOT EXISTS prevent_field_marker_reclassification
      BEFORE UPDATE OF kind ON map_markers
      FOR EACH ROW
      WHEN OLD.kind = 'field'
        AND NEW.kind <> 'field'
        AND EXISTS (SELECT 1 FROM crop_cycles WHERE field_marker_id = OLD.id)
      BEGIN
        SELECT RAISE(ABORT, 'Remove this field’s crop cycles before changing its marker type.');
      END;
      PRAGMA user_version = 2;
      COMMIT;
    `);
  }
}
