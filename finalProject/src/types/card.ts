export type CardMetadata = {
  cardKey: string;
  scryfallId: string;
  name: string;
  setCode: string;
  collectorNumber: string;
  imageSmall: string | null;
  imageNormal: string | null;
  manaCost: string | null;
  typeLine: string;
  priceUsd: string | null;
};

export type CardListEntry = {
  cardKey: string;
  name: string;
  qty: number;
  setCode?: string;
  collectorNumber?: string;
  sourceLines: number[];
};

export type BinderListKind = 'haves' | 'wants';

export type BinderCardRecord = {
  name: string;
  qty: number;
  setCode: string;
  scryfallId: string;
  imageSmall: string | null;
};

export type BinderCard = BinderCardRecord & {
  cardKey: string;
};
