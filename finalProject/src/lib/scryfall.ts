import { create } from 'axios';

import { getCachedCards, saveCardsToCache } from '@/lib/card-cache';
import { normalizeCardName } from '@/lib/normalize';
import type { CardListEntry, CardMetadata } from '@/types/card';

const COLLECTION_LIMIT = 75;
const REQUEST_DELAY_MS = 500;

type ScryfallIdentifier = {
  name?: string;
  set?: string;
  collector_number?: string;
};

type ScryfallImageUris = {
  small: string;
  normal: string;
};

type ScryfallCard = {
  id: string;
  name: string;
  set: string;
  collector_number: string;
  mana_cost?: string;
  type_line: string;
  image_uris?: ScryfallImageUris;
  card_faces?: { image_uris?: ScryfallImageUris }[];
  prices: { usd?: string | null };
};

type ScryfallCollectionResponse = {
  data: ScryfallCard[];
  not_found: ScryfallIdentifier[];
};

export type ResolveCardMetadataResult = {
  cards: Record<string, CardMetadata>;
  notFound: CardListEntry[];
  cacheHits: number;
  networkRequests: number;
};

const scryfallClient = create({
  baseURL: 'https://api.scryfall.com',
  headers: {
    Accept: 'application/json;q=0.9,*/*;q=0.8',
    'User-Agent': 'MTGTradeBinder/1.0',
  },
});

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function toIdentifier(entry: CardListEntry): ScryfallIdentifier {
  if (entry.setCode && entry.collectorNumber) {
    return {
      set: entry.setCode.toLowerCase(),
      collector_number: entry.collectorNumber,
    };
  }

  return {
    name: entry.name,
    ...(entry.setCode ? { set: entry.setCode.toLowerCase() } : {}),
  };
}

function toCardMetadata(card: ScryfallCard): CardMetadata {
  const imageUris = card.image_uris ?? card.card_faces?.[0]?.image_uris;
  return {
    cardKey: normalizeCardName(card.name),
    scryfallId: card.id,
    name: card.name,
    setCode: card.set.toUpperCase(),
    collectorNumber: card.collector_number,
    imageSmall: imageUris?.small ?? null,
    imageNormal: imageUris?.normal ?? null,
    manaCost: card.mana_cost ?? null,
    typeLine: card.type_line,
    priceUsd: card.prices.usd ?? null,
  };
}

export async function resolveCardMetadata(
  entries: CardListEntry[]
): Promise<ResolveCardMetadataResult> {
  const uniqueEntries = [...new Map(entries.map((entry) => [entry.cardKey, entry])).values()];
  const cachedCards = await getCachedCards(uniqueEntries.map((entry) => entry.cardKey));
  const misses = uniqueEntries.filter((entry) => !cachedCards[entry.cardKey]);
  const fetchedCards: Record<string, CardMetadata> = {};
  let networkRequests = 0;

  const batches = chunk(misses, COLLECTION_LIMIT);
  for (let index = 0; index < batches.length; index += 1) {
    if (index > 0) await wait(REQUEST_DELAY_MS);

    const batch = batches[index];
    const response = await scryfallClient.post<ScryfallCollectionResponse>('/cards/collection', {
      identifiers: batch.map(toIdentifier),
    });
    networkRequests += 1;

    response.data.data.forEach((scryfallCard) => {
      const card = toCardMetadata(scryfallCard);
      fetchedCards[card.cardKey] = card;
    });
  }

  await saveCardsToCache(Object.values(fetchedCards));
  const cards = { ...cachedCards, ...fetchedCards };

  return {
    cards,
    notFound: uniqueEntries.filter((entry) => !cards[entry.cardKey]),
    cacheHits: Object.keys(cachedCards).length,
    networkRequests,
  };
}
