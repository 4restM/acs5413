import type { TradeRecord } from '@/types/trade';

export function tradeRecordToList(value: Record<string, Omit<TradeRecord, 'id'>> | null) {
  if (!value) return [];

  return Object.entries(value)
    .map(([id, trade]) => ({ id, ...trade }))
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
}

export function formatTradeDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
