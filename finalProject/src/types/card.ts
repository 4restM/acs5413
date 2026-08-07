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
