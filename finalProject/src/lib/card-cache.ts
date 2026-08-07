import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import type { CardMetadata } from '@/types/card';

const DATABASE_NAME = 'mtg-trade-binder.db';
const SELECT_CHUNK_SIZE = 400;

type CardCacheRow = {
  card_key: string;
  scryfall_id: string;
  name: string;
  set_code: string;
  collector_number: string;
  image_small: string | null;
  image_normal: string | null;
  mana_cost: string | null;
  type_line: string;
  price_usd: string | null;
};

let databasePromise: Promise<SQLiteDatabase> | null = null;

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function rowToCard(row: CardCacheRow): CardMetadata {
  return {
    cardKey: row.card_key,
    scryfallId: row.scryfall_id,
    name: row.name,
    setCode: row.set_code,
    collectorNumber: row.collector_number,
    imageSmall: row.image_small,
    imageNormal: row.image_normal,
    manaCost: row.mana_cost,
    typeLine: row.type_line,
    priceUsd: row.price_usd,
  };
}

export async function initializeCardCache() {
  if (!databasePromise) {
    databasePromise = openDatabaseAsync(DATABASE_NAME).then(async (database) => {
      await database.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS card_cache (
          card_key TEXT PRIMARY KEY NOT NULL,
          scryfall_id TEXT NOT NULL,
          name TEXT NOT NULL,
          set_code TEXT NOT NULL,
          collector_number TEXT NOT NULL,
          image_small TEXT,
          image_normal TEXT,
          mana_cost TEXT,
          type_line TEXT NOT NULL,
          price_usd TEXT,
          updated_at INTEGER NOT NULL
        );
      `);
      return database;
    });
  }

  return databasePromise;
}

export async function getCachedCards(cardKeys: string[]) {
  const uniqueKeys = [...new Set(cardKeys)];
  const cards: Record<string, CardMetadata> = {};
  if (uniqueKeys.length === 0) return cards;

  const database = await initializeCardCache();
  for (const keyChunk of chunk(uniqueKeys, SELECT_CHUNK_SIZE)) {
    const placeholders = keyChunk.map(() => '?').join(', ');
    const rows = await database.getAllAsync<CardCacheRow>(
      `SELECT * FROM card_cache WHERE card_key IN (${placeholders})`,
      keyChunk
    );
    rows.forEach((row) => {
      const card = rowToCard(row);
      cards[card.cardKey] = card;
    });
  }

  return cards;
}

export async function saveCardsToCache(cards: CardMetadata[]) {
  if (cards.length === 0) return;

  const database = await initializeCardCache();
  await database.withTransactionAsync(async () => {
    for (const card of cards) {
      await database.runAsync(
        `INSERT INTO card_cache (
          card_key, scryfall_id, name, set_code, collector_number,
          image_small, image_normal, mana_cost, type_line, price_usd, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(card_key) DO UPDATE SET
          scryfall_id = excluded.scryfall_id,
          name = excluded.name,
          set_code = excluded.set_code,
          collector_number = excluded.collector_number,
          image_small = excluded.image_small,
          image_normal = excluded.image_normal,
          mana_cost = excluded.mana_cost,
          type_line = excluded.type_line,
          price_usd = excluded.price_usd,
          updated_at = excluded.updated_at`,
        [
          card.cardKey,
          card.scryfallId,
          card.name,
          card.setCode,
          card.collectorNumber,
          card.imageSmall,
          card.imageNormal,
          card.manaCost,
          card.typeLine,
          card.priceUsd,
          Date.now(),
        ]
      );
    }
  });
}
