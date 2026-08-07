import type { TradeRecord } from '@/types/trade';

type StoredTradeRecord = Omit<TradeRecord, 'id'>;

export function tradeRecordToList(value: Record<string, StoredTradeRecord> | null) {
  if (!value) return [];

  return Object.entries(value)
    .map(([id, trade]) => ({ id, ...trade }))
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime()
    );
}

export function countTradeParticipation(
  value: Record<string, StoredTradeRecord> | null,
  uid: string
) {
  if (!value) return 0;

  // Either participant can record a trade, so both sides of the relationship count.
  return Object.values(value).filter(
    (trade) => trade.loggedBy === uid || trade.partnerUid === uid
  ).length;
}

export function formatTradeDate(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
