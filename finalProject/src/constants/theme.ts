import { StyleSheet, type TextStyle } from 'react-native';

export const colors = {
  background: '#0E0F12',
  surface: '#16181C',
  surfaceAlt: '#1E2128',
  border: '#262932',
  text: '#F2F3F5',
  textMuted: '#878D99',
  accent: '#3B82F6',
  accentSoft: '#6FA0F7',
  success: '#2FA45B',
  danger: '#E5484D',
  mana: {
    white: '#F3EFD4',
    blue: '#2C7FC4',
    black: '#4A4A4E',
    red: '#D3403F',
    green: '#2B8055',
    colorless: '#8B9099',
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
} as const;

export const typeScale = {
  caption: 12,
  body: 16,
  subtitle: 17,
  title: 24,
  display: 30,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const satisfies Record<string, TextStyle['fontWeight']>;

export const hairline = StyleSheet.hairlineWidth;

export const tabularNumbers: TextStyle = { fontVariant: ['tabular-nums'] };
