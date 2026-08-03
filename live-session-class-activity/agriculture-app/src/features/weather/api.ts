import type { WeatherSnapshot } from './types';

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: unknown;
    apparent_temperature?: unknown;
    precipitation?: unknown;
    weather_code?: unknown;
    wind_speed_10m?: unknown;
  };
  daily?: {
    time?: unknown;
    temperature_2m_max?: unknown;
    temperature_2m_min?: unknown;
    weather_code?: unknown;
  };
};

function numberAt(value: unknown, index?: number) {
  const candidate = index === undefined ? value : Array.isArray(value) ? value[index] : undefined;
  if (typeof candidate !== 'number' || !Number.isFinite(candidate)) {
    throw new Error('Weather service returned incomplete data.');
  }
  return candidate;
}

function dateAt(value: unknown, index: number) {
  const candidate = Array.isArray(value) ? value[index] : undefined;
  if (typeof candidate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
    throw new Error('Weather service returned invalid forecast dates.');
  }
  return candidate;
}

export function normalizeWeatherResponse(value: unknown): WeatherSnapshot {
  if (!value || typeof value !== 'object') throw new Error('Weather service returned invalid data.');
  const response = value as OpenMeteoResponse;
  const current = response.current;
  const daily = response.daily;
  if (!current || !daily) throw new Error('Weather service returned incomplete data.');

  const dailyTime = daily.time;
  const dailyMax = daily.temperature_2m_max;
  const dailyMin = daily.temperature_2m_min;
  const dailyCodes = daily.weather_code;
  if (
    !Array.isArray(dailyTime) ||
    !Array.isArray(dailyMax) ||
    !Array.isArray(dailyMin) ||
    !Array.isArray(dailyCodes) ||
    dailyTime.length < 3 ||
    dailyMax.length < 3 ||
    dailyMin.length < 3 ||
    dailyCodes.length < 3
  ) {
    throw new Error('Weather service did not include a three-day forecast.');
  }

  return {
    temperature: numberAt(current.temperature_2m),
    apparentTemperature: numberAt(current.apparent_temperature),
    precipitation: numberAt(current.precipitation),
    weatherCode: numberAt(current.weather_code),
    windSpeed: numberAt(current.wind_speed_10m),
    days: [0, 1, 2].map((index) => ({
      date: dateAt(dailyTime, index),
      temperatureMax: numberAt(dailyMax, index),
      temperatureMin: numberAt(dailyMin, index),
      weatherCode: numberAt(dailyCodes, index),
    })),
  };
}

export async function fetchWeather(latitude: number, longitude: number, signal?: AbortSignal) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code',
    timezone: 'auto',
    forecast_days: '3',
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, { signal });
  if (!response.ok) throw new Error('Weather service is unavailable.');
  return normalizeWeatherResponse(await response.json());
}

export function weatherDescription(code: number) {
  if (code === 0) return 'Clear sky';
  if ([1, 2, 3].includes(code)) return 'Partly cloudy';
  if ([45, 48].includes(code)) return 'Fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
  if ([95, 96, 99].includes(code)) return 'Thunderstorm';
  return 'Unknown conditions';
}
