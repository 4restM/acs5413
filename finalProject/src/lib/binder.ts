import type {
  BinderCard,
  BinderCardRecord,
  CardListEntry,
  CardMetadata,
} from '@/types/card';
import type { BinderAdjustment } from '@/types/trade';

export function buildBinderCards(
  entries: CardListEntry[],
  metadataByKey: Record<string, CardMetadata>
) {
  return entries.flatMap<BinderCard>((entry) => {
    const metadata = metadataByKey[entry.cardKey];
    if (!metadata) return [];

    return [
      {
        cardKey: entry.cardKey,
        name: metadata.name,
        qty: entry.qty,
        setCode: metadata.setCode,
        scryfallId: metadata.scryfallId,
        imageSmall: metadata.imageSmall,
      },
    ];
  });
}

export function createBinderPatch(cards: BinderCard[]) {
  return cards.reduce<Record<string, BinderCardRecord>>((patch, card) => {
    patch[card.cardKey] = {
      name: card.name,
      qty: card.qty,
      setCode: card.setCode,
      scryfallId: card.scryfallId,
      imageSmall: card.imageSmall,
    };
    return patch;
  }, {});
}

export function binderRecordToList(value: Record<string, BinderCardRecord> | null) {
  if (!value) return [];

  return Object.entries(value)
    .map(([cardKey, card]) => ({ cardKey, ...card }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

export function createBinderAdjustmentPatch(adjustments: BinderAdjustment[]) {
  // One multi-path PATCH updates quantities and removes zero-count cards.
  return adjustments.reduce<Record<string, number | null>>((patch, adjustment) => {
    const basePath = `${adjustment.listKind}/${adjustment.cardKey}`;
    if (adjustment.remainingQty > 0) patch[`${basePath}/qty`] = adjustment.remainingQty;
    else patch[basePath] = null;
    return patch;
  }, {});
}
