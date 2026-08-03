import type { SQLiteDatabase } from 'expo-sqlite';

import { fetchWeather } from './api';
import type { WeatherCache, WeatherSnapshot, WeatherState } from './types';

export const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000;

function sameLocation(cache: WeatherCache, latitude: number, longitude: number) {
  return cache.latitude === latitude && cache.longitude === longitude;
}

export function isCacheFresh(fetchedAt: string, now = Date.now()) {
  const timestamp = Date.parse(fetchedAt);
  return Number.isFinite(timestamp) && now - timestamp <= WEATHER_CACHE_TTL_MS;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isWeatherSnapshot(value: unknown): value is WeatherSnapshot {
  if (!value || typeof value !== 'object') return false;
  const snapshot = value as Partial<WeatherSnapshot>;
  if (
    !isFiniteNumber(snapshot.temperature) ||
    !isFiniteNumber(snapshot.apparentTemperature) ||
    !isFiniteNumber(snapshot.precipitation) ||
    !isFiniteNumber(snapshot.weatherCode) ||
    !isFiniteNumber(snapshot.windSpeed) ||
    !Array.isArray(snapshot.days) ||
    snapshot.days.length !== 3
  ) return false;

  return snapshot.days.every((day) =>
    Boolean(day) &&
    /^\d{4}-\d{2}-\d{2}$/.test(day.date) &&
    isFiniteNumber(day.temperatureMax) &&
    isFiniteNumber(day.temperatureMin) &&
    isFiniteNumber(day.weatherCode),
  );
}

export async function getMatchingCache(db: SQLiteDatabase, latitude: number, longitude: number) {
  const cache = await db.getFirstAsync<WeatherCache>('SELECT * FROM weather_cache WHERE id = 1');
  if (!cache || !sameLocation(cache, latitude, longitude)) return null;
  try {
    const snapshot: unknown = JSON.parse(cache.payload_json);
    if (!isWeatherSnapshot(snapshot)) return null;
    return { snapshot, fetchedAt: cache.fetched_at };
  } catch {
    return null;
  }
}

async function saveCache(db: SQLiteDatabase, latitude: number, longitude: number, snapshot: WeatherSnapshot) {
  await db.runAsync(
    `INSERT OR REPLACE INTO weather_cache (id, latitude, longitude, fetched_at, payload_json)
     VALUES (1, ?, ?, ?, ?)`,
    latitude,
    longitude,
    new Date().toISOString(),
    JSON.stringify(snapshot),
  );
}

export async function loadWeather(
  db: SQLiteDatabase,
  latitude: number,
  longitude: number,
  options: { forceRefresh?: boolean } = {},
): Promise<WeatherState> {
  const cached = await getMatchingCache(db, latitude, longitude);
  if (cached && !options.forceRefresh && isCacheFresh(cached.fetchedAt)) {
    return { snapshot: cached.snapshot, fetchedAt: cached.fetchedAt, isFresh: true, error: null };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const snapshot = await fetchWeather(latitude, longitude, controller.signal);
    const fetchedAt = new Date().toISOString();
    await saveCache(db, latitude, longitude, snapshot);
    return { snapshot, fetchedAt, isFresh: true, error: null };
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Weather request timed out. Try again when you have a connection.'
      : 'Could not refresh weather. Check your connection and try again.';
    if (cached) {
      return { snapshot: cached.snapshot, fetchedAt: cached.fetchedAt, isFresh: false, error: message };
    }
    return { snapshot: null, fetchedAt: null, isFresh: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}
