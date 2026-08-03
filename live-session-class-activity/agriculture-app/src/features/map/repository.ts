import type { SQLiteDatabase } from 'expo-sqlite';

import { isMarkerKind, parseCoordinate, requiredText, type MarkerKind } from '@/utils/validation';

export type FarmMarker = {
  id: number;
  name: string;
  kind: MarkerKind;
  latitude: number;
  longitude: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type MarkerInput = {
  name: string;
  kind: MarkerKind;
  latitude: number | string;
  longitude: number | string;
  notes?: string;
};

function normalizeMarker(input: MarkerInput) {
  if (!isMarkerKind(input.kind)) throw new Error('Choose a valid marker type.');
  return {
    name: requiredText(input.name, 'Marker name'),
    kind: input.kind,
    latitude: parseCoordinate(input.latitude, 'Latitude'),
    longitude: parseCoordinate(input.longitude, 'Longitude'),
    notes: input.notes?.trim() ?? '',
  };
}

export function listMarkers(db: SQLiteDatabase) {
  return db.getAllAsync<FarmMarker>('SELECT * FROM map_markers ORDER BY name COLLATE NOCASE');
}

export function listFieldMarkers(db: SQLiteDatabase) {
  return db.getAllAsync<FarmMarker>(
    "SELECT * FROM map_markers WHERE kind = 'field' ORDER BY name COLLATE NOCASE",
  );
}

export async function createMarker(db: SQLiteDatabase, input: MarkerInput) {
  const marker = normalizeMarker(input);
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO map_markers (name, kind, latitude, longitude, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    marker.name,
    marker.kind,
    marker.latitude,
    marker.longitude,
    marker.notes,
    now,
    now,
  );
  return result.lastInsertRowId;
}

export async function updateMarker(db: SQLiteDatabase, id: number, input: MarkerInput) {
  const marker = normalizeMarker(input);
  const existing = await db.getFirstAsync<{ kind: MarkerKind }>('SELECT kind FROM map_markers WHERE id = ?', id);
  if (!existing) throw new Error('Marker was not found.');
  if (existing.kind === 'field' && marker.kind !== 'field') {
    const usage = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM crop_cycles WHERE field_marker_id = ?',
      id,
    );
    if ((usage?.count ?? 0) > 0) {
      throw new Error('Remove this field’s crop cycles before changing its marker type.');
    }
  }
  const result = await db.runAsync(
    `UPDATE map_markers
     SET name = ?, kind = ?, latitude = ?, longitude = ?, notes = ?, updated_at = ?
     WHERE id = ?`,
    marker.name,
    marker.kind,
    marker.latitude,
    marker.longitude,
    marker.notes,
    new Date().toISOString(),
    id,
  );
  if (result.changes !== 1) throw new Error('Marker was not found.');
}

export async function deleteMarker(db: SQLiteDatabase, marker: FarmMarker) {
  if (marker.kind === 'field') {
    const usage = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) AS count FROM crop_cycles WHERE field_marker_id = ?',
      marker.id,
    );
    if ((usage?.count ?? 0) > 0) {
      throw new Error('Remove this field’s crop cycles before deleting the field marker.');
    }
  }
  const result = await db.runAsync('DELETE FROM map_markers WHERE id = ?', marker.id);
  if (result.changes !== 1) throw new Error('Marker was not found.');
}
