import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeCardName } from '../src/lib/normalize.ts';

test('normalizes accents, ligatures, and RTDB-illegal characters', () => {
  assert.equal(normalizeCardName('Jötun Grunt'), 'jotun-grunt');
  assert.equal(normalizeCardName("Lim-Dûl's Vault"), "lim-dul's-vault");
  assert.equal(normalizeCardName('Æther Gust'), 'aether-gust');
  assert.equal(normalizeCardName('Mr. Orfeo, the Boulder'), 'mr-orfeo,-the-boulder');
  assert.equal(normalizeCardName('Test $Card #[One]'), 'test-card-one');
});

test('uses only the front face of a double-faced card', () => {
  assert.equal(normalizeCardName('Delver of Secrets // Insectile Aberration'), 'delver-of-secrets');
});

test('parses and consolidates Moxfield, Arena, and plain list lines', async () => {
  const { parseCardList } = await import('../src/lib/parse-list.ts');
  const result = parseCardList(`
Deck
4 Lightning Bolt
2x Counterspell (2XM) 50
1 Lightning Bolt *F*
1 Delver of Secrets // Insectile Aberration (MID) 47
// a comment
Sideboard:
`);

  assert.equal(result.cards.length, 3);
  assert.equal(result.skippedLines.length, 0);
  assert.deepEqual(result.cards[0], {
    cardKey: 'lightning-bolt',
    name: 'Lightning Bolt',
    qty: 5,
    setCode: undefined,
    collectorNumber: undefined,
    sourceLines: [3, 5],
  });
  assert.equal(result.cards[1].setCode, '2XM');
  assert.equal(result.cards[1].collectorNumber, '50');
  assert.equal(result.cards[2].cardKey, 'delver-of-secrets');
});

test('builds an idempotent Firebase binder patch keyed by normalized card name', async () => {
  const { buildBinderCards, createBinderPatch, binderRecordToList } = await import(
    '../src/lib/binder.ts'
  );
  const entries = [
    {
      cardKey: 'lightning-bolt',
      name: 'Lightning Bolt',
      qty: 4,
      sourceLines: [1],
    },
    {
      cardKey: 'missing-card',
      name: 'Missing Card',
      qty: 1,
      sourceLines: [2],
    },
  ];
  const metadata = {
    'lightning-bolt': {
      cardKey: 'lightning-bolt',
      scryfallId: 'scryfall-id',
      name: 'Lightning Bolt',
      setCode: 'M11',
      collectorNumber: '149',
      imageSmall: 'https://example.com/small.jpg',
      imageNormal: 'https://example.com/normal.jpg',
      manaCost: '{R}',
      typeLine: 'Instant',
      priceUsd: '1.25',
    },
  };

  const cards = buildBinderCards(entries, metadata);
  assert.equal(cards.length, 1);
  const patch = createBinderPatch(cards);
  assert.deepEqual(Object.keys(patch), ['lightning-bolt']);
  assert.equal(patch['lightning-bolt'].qty, 4);
  assert.equal('cardKey' in patch['lightning-bolt'], false);
  assert.deepEqual(binderRecordToList(patch), cards);
});
