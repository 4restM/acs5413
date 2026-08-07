import type { BinderCard } from '@/types/card';
import type { BidirectionalMatch, MatchItem } from '@/types/trade';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidPartnerUid(value: string) {
  return UUID_PATTERN.test(value.trim());
}

function intersect(wants: BinderCard[], availableCards: BinderCard[]) {
  // DISCUSSION POINT: A Map turns each direction of the comparison into linear-time
  // key lookups, and the minimum quantity prevents suggesting more copies than exist.
  const availableByKey = new Map(availableCards.map((card) => [card.cardKey, card]));

  return wants
    .flatMap<MatchItem>((wantedCard) => {
      const availableCard = availableByKey.get(wantedCard.cardKey);
      if (!availableCard) return [];

      return [
        {
          card: availableCard,
          requestedQty: wantedCard.qty,
          availableQty: availableCard.qty,
          matchQty: Math.min(wantedCard.qty, availableCard.qty),
        },
      ];
    })
    .sort((first, second) => first.card.name.localeCompare(second.card.name));
}

export function computeBidirectionalMatch(
  myHaves: BinderCard[],
  myWants: BinderCard[],
  theirHaves: BinderCard[],
  theirWants: BinderCard[]
): BidirectionalMatch {
  return {
    theyHaveForMe: intersect(myWants, theirHaves),
    iHaveForThem: intersect(theirWants, myHaves),
  };
}
