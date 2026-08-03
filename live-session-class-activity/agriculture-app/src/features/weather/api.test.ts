import { describe, expect, it } from '@jest/globals';

import { normalizeWeatherResponse, weatherDescription } from './api';

const response = {
  current: { temperature_2m: 24.5, apparent_temperature: 25.1, precipitation: 0, weather_code: 2, wind_speed_10m: 14.2 },
  daily: {
    time: ['2026-07-27', '2026-07-28', '2026-07-29'],
    temperature_2m_max: [28, 30, 31],
    temperature_2m_min: [18, 19, 20],
    weather_code: [2, 61, 95],
  },
};

describe('Open-Meteo normalization', () => {
  it('keeps only the current conditions and three required forecast days', () => {
    expect(normalizeWeatherResponse(response)).toEqual({
      temperature: 24.5,
      apparentTemperature: 25.1,
      precipitation: 0,
      weatherCode: 2,
      windSpeed: 14.2,
      days: [
        { date: '2026-07-27', temperatureMax: 28, temperatureMin: 18, weatherCode: 2 },
        { date: '2026-07-28', temperatureMax: 30, temperatureMin: 19, weatherCode: 61 },
        { date: '2026-07-29', temperatureMax: 31, temperatureMin: 20, weatherCode: 95 },
      ],
    });
  });

  it('rejects responses without all three forecast rows', () => {
    expect(() => normalizeWeatherResponse({ ...response, daily: { ...response.daily, time: ['2026-07-27'] } })).toThrow('three-day forecast');
  });

  it('maps weather codes to readable descriptions', () => {
    expect(weatherDescription(0)).toBe('Clear sky');
    expect(weatherDescription(61)).toBe('Rain');
    expect(weatherDescription(999)).toBe('Unknown conditions');
  });
});
