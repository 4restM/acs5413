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
