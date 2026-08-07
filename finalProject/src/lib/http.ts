import { create } from 'axios';
import type { AxiosError } from 'axios';

export const BACKEND_URL = (process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL ?? '').replace(
  /\/$/,
  ''
);

export function requireBackendUrl() {
  if (!BACKEND_URL) {
    throw new Error(
      'Firebase is not configured. Copy .env.example to .env.local and add your Realtime Database URL.'
    );
  }
}

export const rtdbClient = create({
  baseURL: BACKEND_URL || undefined,
  headers: { 'Content-Type': 'application/json' },
});

// Keep REST logs in Metro; they are useful when a Firebase write fails.
rtdbClient.interceptors.request.use((config) => {
  console.log(`[RTDB] ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');
  return config;
});

rtdbClient.interceptors.response.use(
  (response) => {
    console.log(`[RTDB] ${response.status} ${response.config.url}`, response.data ?? '');
    return response;
  },
  (error: AxiosError) => {
    console.error(
      `[RTDB] ${error.response?.status ?? 'NETWORK'} ${error.config?.url ?? 'unknown URL'}`,
      error.response?.data ?? error.message
    );
    return Promise.reject(error);
  }
);
