import { StyleSheet, type TextStyle } from 'react-native';

/**
 * Graphite neutrals with a single saturated accent. The accent is reserved for
 * interactive elements — active tabs, selected segments, primary buttons, links.
 * Everything else stays neutral so card art and mana colors carry the color.
 */
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

/**
 * Hierarchy comes from size and color first, weight second. Nothing goes above
 * semibold — heavy weights on every label are what make a list look shouted.
 */
export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const satisfies Record<string, TextStyle['fontWeight']>;

/** Rule between rows in a dense list. One physical pixel, never a full border. */
export const hairline = StyleSheet.hairlineWidth;

/** Keeps quantities and prices from shifting width as digits change. */
export const tabularNumbers: TextStyle = { fontVariant: ['tabular-nums'] };
