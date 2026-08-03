export type WeatherDay = {
  date: string;
  temperatureMax: number;
  temperatureMin: number;
  weatherCode: number;
};

export type WeatherSnapshot = {
  temperature: number;
  apparentTemperature: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  days: WeatherDay[];
};

export type WeatherCache = {
  id: 1;
  latitude: number;
  longitude: number;
  fetched_at: string;
  payload_json: string;
};

export type WeatherState = {
  snapshot: WeatherSnapshot | null;
  fetchedAt: string | null;
  isFresh: boolean;
  error: string | null;
};
