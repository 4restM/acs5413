import type { SeedStore, Store, StoreRecord } from '@/types/store';

export function storeRecordToList(record: Record<string, StoreRecord> | null): Store[] {
  if (!record) return [];

  // DISCUSSION POINT: Firebase returns an object keyed by push ID, not an array.
  // Object.entries preserves that key by moving it into each Store as its `id`.
  return Object.entries(record)
    .map(([id, store]) => ({ id, ...store }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function createSeedStorePatch(
  stores: SeedStore[],
  addedBy: string,
  createdAt = new Date().toISOString()
): Record<string, StoreRecord> {
  return Object.fromEntries(
    stores.map(({ id, ...store }) => [id, { ...store, addedBy, createdAt }])
  );
}

export function parseStoreCoordinates(latitude: string, longitude: string) {
  const lat = Number(latitude.trim());
  const lng = Number(longitude.trim());

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Latitude and longitude must both be numbers.');
  }
  if (lat < -90 || lat > 90) {
    throw new Error('Latitude must be between -90 and 90.');
  }
  if (lng < -180 || lng > 180) {
    throw new Error('Longitude must be between -180 and 180.');
  }

  return { lat, lng };
}
