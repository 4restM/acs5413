import type { SQLiteDatabase } from 'expo-sqlite';

import { isCropStatus, parseYear, requiredText, type CropStatus } from '@/utils/validation';

export type CropCycle = {
  id: number;
  field_marker_id: number;
  crop_name: string;
  season: string;
  year: number;
  status: CropStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type CropCycleInput = {
  fieldMarkerId: number | string;
  cropName: string;
  season: string;
  year: number | string;
  status: CropStatus;
  notes?: string;
};

async function normalizeCycle(db: SQLiteDatabase, input: CropCycleInput) {
  const fieldMarkerId = Number(input.fieldMarkerId);
  if (!Number.isInteger(fieldMarkerId) || fieldMarkerId <= 0) throw new Error('Choose a field.');
  const field = await db.getFirstAsync<{ id: number }>(
    "SELECT id FROM map_markers WHERE id = ? AND kind = 'field'",
    fieldMarkerId,
  );
  if (!field) throw new Error('Choose an existing field marker.');
  if (!isCropStatus(input.status)) throw new Error('Choose a valid crop status.');
  return {
    fieldMarkerId,
    cropName: requiredText(input.cropName, 'Crop name'),
    season: requiredText(input.season, 'Season'),
    year: parseYear(input.year),
    status: input.status,
    notes: input.notes?.trim() ?? '',
  };
}

export function listCropCycles(db: SQLiteDatabase, fieldMarkerId: number) {
  return db.getAllAsync<CropCycle>(
    `SELECT * FROM crop_cycles WHERE field_marker_id = ?
     ORDER BY year DESC, created_at DESC`,
    fieldMarkerId,
  );
}

export async function createCropCycle(db: SQLiteDatabase, input: CropCycleInput) {
  const cycle = await normalizeCycle(db, input);
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO crop_cycles (field_marker_id, crop_name, season, year, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    cycle.fieldMarkerId,
    cycle.cropName,
    cycle.season,
    cycle.year,
    cycle.status,
    cycle.notes,
    now,
    now,
  );
}

export async function updateCropCycle(db: SQLiteDatabase, id: number, input: CropCycleInput) {
  const cycle = await normalizeCycle(db, input);
  const result = await db.runAsync(
    `UPDATE crop_cycles
       SET field_marker_id = ?, crop_name = ?, season = ?, year = ?, status = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    cycle.fieldMarkerId,
    cycle.cropName,
    cycle.season,
    cycle.year,
    cycle.status,
    cycle.notes,
    new Date().toISOString(),
    id,
  );
  if (result.changes !== 1) throw new Error('Crop cycle was not found.');
}

export async function deleteCropCycle(db: SQLiteDatabase, id: number) {
  const result = await db.runAsync('DELETE FROM crop_cycles WHERE id = ?', id);
  if (result.changes !== 1) throw new Error('Crop cycle was not found.');
}
