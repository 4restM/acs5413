export function formatCurrency(cents: number) {
  const sign = cents < 0 ? '-' : '';
  const absolute = Math.abs(cents);
  return `${sign}$${Math.floor(absolute / 100).toLocaleString()}.${String(absolute % 100).padStart(2, '0')}`;
}
