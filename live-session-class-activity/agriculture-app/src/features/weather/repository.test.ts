import { describe, expect, it } from '@jest/globals';

import { getMatchingCache, isCacheFresh, isWeatherSnapshot, WEATHER_CACHE_TTL_MS } from './repository';

describe('weather cache freshness', () => {
  it('treats matching cache as fresh for thirty minutes and stale after the threshold', () => {
    const now = Date.parse('2026-07-27T18:00:00.000Z');
    expect(isCacheFresh('2026-07-27T17:30:00.000Z', now)).toBe(true);
    expect(isCacheFresh('2026-07-27T17:29:59.999Z', now)).toBe(false);
    expect(WEATHER_CACHE_TTL_MS).toBe(30 * 60 * 1000);
  });
});

describe('weather cache validation', () => {
  it('rejects a cached payload that would crash the weather display', async () => {
    const db = {
      getFirstAsync: async () => ({
        id: 1,
        latitude: 35.2,
        longitude: -97.4,
        fetched_at: '2026-07-27T18:00:00.000Z',
        payload_json: JSON.stringify({ temperature: 'warm', days: [{}, {}, {}] }),
      }),
    } as never;

    await expect(getMatchingCache(db, 35.2, -97.4)).resolves.toBeNull();
    expect(isWeatherSnapshot({ temperature: 12, apparentTemperature: 12, precipitation: 0, weatherCode: 0, windSpeed: 4, days: [] })).toBe(false);
  });
});
