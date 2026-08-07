export const colors = {
  background: '#0F1115',
  surface: '#181B22',
  surfaceAlt: '#212630',
  border: '#2C323D',
  text: '#ECEDEF',
  textMuted: '#9AA1AD',
  accent: '#C9A227',
  accentSoft: '#E3C55A',
  success: '#3FB950',
  danger: '#F85149',
  mana: {
    white: '#F8F6D8',
    blue: '#0E68AB',
    black: '#5C5A5C',
    red: '#D3202A',
    green: '#00733E',
    colorless: '#9AA1AD',
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
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export const typeScale = {
  caption: 12,
  body: 16,
  subtitle: 18,
  title: 28,
  display: 36,
} as const;
