import type { BinderCard } from '@/types/card';

export type TradePartner = {
  uid: string;
  handle: string;
  haves: BinderCard[];
  wants: BinderCard[];
};

export type MatchItem = {
  card: BinderCard;
  requestedQty: number;
  availableQty: number;
  matchQty: number;
};

export type BidirectionalMatch = {
  theyHaveForMe: MatchItem[];
  iHaveForThem: MatchItem[];
};

export type TradeLine = {
  name: string;
  qty: number;
};

export type TradeSelection = TradeLine & {
  cardKey: string;
};

export type NewTrade = {
  partnerUid: string;
  partnerHandle: string;
  given: TradeLine[];
  received: TradeLine[];
  storeId?: string;
  notes: string;
};

export type TradeRecord = NewTrade & {
  id: string;
  loggedBy: string;
  loggedByHandle: string;
  createdAt: string;
};

export type BinderAdjustment = {
  listKind: 'haves' | 'wants';
  cardKey: string;
  remainingQty: number;
};
