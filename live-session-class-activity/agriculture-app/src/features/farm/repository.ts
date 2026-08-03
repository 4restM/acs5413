import type { SQLiteDatabase } from 'expo-sqlite';

import { parseCoordinate, requiredText } from '@/utils/validation';

export type FarmSettings = {
  id: 1;
  farm_name: string;
  latitude: number;
  longitude: number;
  updated_at: string;
};

export type FarmInput = {
  farmName: string;
  latitude: number | string;
  longitude: number | string;
};

export async function getFarmSettings(db: SQLiteDatabase) {
  const farm = await db.getFirstAsync<FarmSettings>('SELECT * FROM farm_settings WHERE id = 1');
  if (!farm) throw new Error('Farm settings are unavailable. Restart the app to initialize the database.');
  return farm;
}

export async function saveFarmSettings(db: SQLiteDatabase, input: FarmInput) {
  const name = requiredText(input.farmName, 'Farm name');
  const latitude = parseCoordinate(input.latitude, 'Latitude');
  const longitude = parseCoordinate(input.longitude, 'Longitude');
  const result = await db.runAsync(
    `UPDATE farm_settings
       SET farm_name = ?, latitude = ?, longitude = ?, updated_at = ?
     WHERE id = 1`,
    name,
    latitude,
    longitude,
    new Date().toISOString(),
  );
  if (result.changes !== 1) throw new Error('Farm settings could not be saved.');
  await db.runAsync('DELETE FROM weather_cache WHERE id = 1');
}
