import { readFile } from 'node:fs/promises';

import { normalizeCardName } from '../src/lib/normalize';

const DEMO_UID = '54130000-0000-4000-8000-000000000045';
const DEMO_HANDLE = 'demo-trader-45';

const HAVES = [
  'Lightning Bolt',
  'Counterspell',
  'Sol Ring',
  'Arcane Signet',
  'Command Tower',
  'Path to Exile',
  'Beast Within',
  'Chaos Warp',
  'Cultivate',
  "Kodama's Reach",
  'Rhystic Study',
  'Mystic Remora',
  'Swiftfoot Boots',
  'Lightning Greaves',
  'Reliquary Tower',
  'Farseek',
  "Nature's Lore",
  'Brainstorm',
  'Ponder',
  'Dark Ritual',
  'Sign in Blood',
  'Blasphemous Act',
  'Vandalblast',
  'Heroic Intervention',
  'Eternal Witness',
] as const;

const WANTS = [
  'Swords to Plowshares',
  'Llanowar Elves',
  'Birds of Paradise',
  'Dockside Extortionist',
  'Cyclonic Rift',
  'Demonic Tutor',
  'Vampiric Tutor',
  'Smothering Tithe',
  "Teferi's Protection",
  "Jeska's Will",
  'Esper Sentinel',
  'Deflecting Swat',
  'Fierce Guardianship',
  'The Great Henge',
  'Mana Drain',
  'Toxic Deluge',
  'Austere Command',
  'Farewell',
  'Boseiju, Who Endures',
  'Otawara, Soaring City',
] as const;

type ScryfallCard = {
  id: string;
  name: string;
  set: string;
  image_uris?: { small?: string };
  card_faces?: { image_uris?: { small?: string } }[];
};

type ScryfallCollection = {
  data: ScryfallCard[];
  not_found: { name?: string }[];
};

async function getDatabaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL;
  if (configuredUrl) return configuredUrl.replace(/\/$/, '');

  const envText = await readFile(new URL('../.env.local', import.meta.url), 'utf8');
  const setting = envText
    .split(/\r?\n/)
    .find((line) => line.startsWith('EXPO_PUBLIC_FIREBASE_DATABASE_URL='));
  const value = setting?.slice(setting.indexOf('=') + 1).trim();
  if (!value) throw new Error('EXPO_PUBLIC_FIREBASE_DATABASE_URL is not configured.');
  return value.replace(/\/$/, '');
}

async function fetchCards(names: readonly string[]) {
  const response = await fetch('https://api.scryfall.com/cards/collection', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'MTGTradeBinder/1.0 demo seeder',
    },
    body: JSON.stringify({ identifiers: names.map((name) => ({ name })) }),
  });
  if (!response.ok) throw new Error(`Scryfall returned HTTP ${response.status}.`);

  const collection = (await response.json()) as ScryfallCollection;
  if (collection.not_found.length > 0) {
    throw new Error(
      `Scryfall could not resolve: ${collection.not_found.map((card) => card.name).join(', ')}`
    );
  }
  return new Map(collection.data.map((card) => [normalizeCardName(card.name), card]));
}

function createBinder(names: readonly string[], cardsByKey: Map<string, ScryfallCard>) {
  return Object.fromEntries(
    names.map((requestedName) => {
      const cardKey = normalizeCardName(requestedName);
      const card = cardsByKey.get(cardKey);
      if (!card) throw new Error(`No Scryfall card was returned for ${requestedName}.`);
      return [
        cardKey,
        {
          name: card.name,
          qty: 1,
          setCode: card.set.toUpperCase(),
          scryfallId: card.id,
          imageSmall: card.image_uris?.small ?? card.card_faces?.[0]?.image_uris?.small ?? null,
        },
      ];
    })
  );
}

async function main() {
  const databaseUrl = await getDatabaseUrl();
  const userUrl = `${databaseUrl}/users/${DEMO_UID}.json`;
  const existingResponse = await fetch(userUrl);
  if (!existingResponse.ok) {
    throw new Error(`Firebase lookup returned HTTP ${existingResponse.status}.`);
  }
  const existingUser = await existingResponse.json();
  if (existingUser && !process.argv.includes('--force')) {
    throw new Error('The demo account already exists. Re-run with --force to replace it.');
  }

  const allNames = [...HAVES, ...WANTS];
  const cardsByKey = await fetchCards(allNames);
  const demoUser = {
    profile: {
      handle: DEMO_HANDLE,
      createdAt: new Date().toISOString(),
    },
    haves: createBinder(HAVES, cardsByKey),
    wants: createBinder(WANTS, cardsByKey),
  };

  const saveResponse = await fetch(userUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demoUser),
  });
  if (!saveResponse.ok) throw new Error(`Firebase save returned HTTP ${saveResponse.status}.`);

  console.log(`Created @${DEMO_HANDLE} at ${DEMO_UID}`);
  console.log(`Saved ${HAVES.length} haves and ${WANTS.length} wants (${allNames.length} total).`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
