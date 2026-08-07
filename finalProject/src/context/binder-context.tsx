import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useIdentity } from '@/context/identity-context';
import {
  applyBinderAdjustments,
  bulkImportBinder,
  getBinderList,
  removeBinderCard,
  updateBinderQuantity,
} from '@/lib/api';
import type { BinderCard, BinderListKind } from '@/types/card';
import type { BinderAdjustment, TradeSelection } from '@/types/trade';

type BinderContextValue = {
  haves: BinderCard[];
  wants: BinderCard[];
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  importCards: (listKind: BinderListKind, cards: BinderCard[]) => Promise<void>;
  setQuantity: (listKind: BinderListKind, cardKey: string, qty: number) => Promise<void>;
  removeCard: (listKind: BinderListKind, cardKey: string) => Promise<void>;
  applyTradeSelections: (
    given: TradeSelection[],
    received: TradeSelection[]
  ) => Promise<void>;
};

const BinderContext = createContext<BinderContextValue | undefined>(undefined);

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : 'Binder data could not be loaded.';
}

function mergeCards(current: BinderCard[], incoming: BinderCard[]) {
  const cardsByKey = new Map(current.map((card) => [card.cardKey, card]));
  incoming.forEach((card) => cardsByKey.set(card.cardKey, card));
  return [...cardsByKey.values()].sort((first, second) => first.name.localeCompare(second.name));
}

export function BinderProvider({ children }: PropsWithChildren) {
  const { uid, handle } = useIdentity();
  const [haves, setHaves] = useState<BinderCard[]>([]);
  const [wants, setWants] = useState<BinderCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid || !handle) return;

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [loadedHaves, loadedWants] = await Promise.all([
        getBinderList(uid, 'haves'),
        getBinderList(uid, 'wants'),
      ]);
      setHaves(loadedHaves);
      setWants(loadedWants);
    } catch (error: unknown) {
      setErrorMessage(messageFromError(error));
    } finally {
      setIsLoading(false);
    }
  }, [handle, uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const importCards = useCallback(
    async (listKind: BinderListKind, cards: BinderCard[]) => {
      if (!uid) throw new Error('The device identity is not ready.');
      await bulkImportBinder(uid, listKind, cards);
      if (listKind === 'haves') setHaves((current) => mergeCards(current, cards));
      else setWants((current) => mergeCards(current, cards));
    },
    [uid]
  );

  const setQuantity = useCallback(
    async (listKind: BinderListKind, cardKey: string, qty: number) => {
      if (!uid) throw new Error('The device identity is not ready.');
      if (qty < 1) throw new Error('Quantity must be at least 1.');
      await updateBinderQuantity(uid, listKind, cardKey, qty);
      const update = (cards: BinderCard[]) =>
        cards.map((card) => (card.cardKey === cardKey ? { ...card, qty } : card));
      if (listKind === 'haves') setHaves(update);
      else setWants(update);
    },
    [uid]
  );

  const removeCard = useCallback(
    async (listKind: BinderListKind, cardKey: string) => {
      if (!uid) throw new Error('The device identity is not ready.');
      await removeBinderCard(uid, listKind, cardKey);
      const withoutCard = (cards: BinderCard[]) =>
        cards.filter((card) => card.cardKey !== cardKey);
      if (listKind === 'haves') setHaves(withoutCard);
      else setWants(withoutCard);
    },
    [uid]
  );

  const applyTradeSelections = useCallback(
    async (given: TradeSelection[], received: TradeSelection[]) => {
      if (!uid) throw new Error('The device identity is not ready.');

      const selections = [
        ...given.map((selection) => ({ listKind: 'haves' as const, selection })),
        ...received.map((selection) => ({ listKind: 'wants' as const, selection })),
      ];
      const adjustments: BinderAdjustment[] = selections.map(({ listKind, selection }) => {
        const currentCards = listKind === 'haves' ? haves : wants;
        const currentCard = currentCards.find((card) => card.cardKey === selection.cardKey);
        if (!currentCard || selection.qty > currentCard.qty) {
          throw new Error(`${selection.name} no longer has enough quantity to adjust.`);
        }
        return {
          listKind,
          cardKey: selection.cardKey,
          remainingQty: currentCard.qty - selection.qty,
        };
      });

      await applyBinderAdjustments(uid, adjustments);
      const applyLocally = (cards: BinderCard[], listKind: BinderListKind) => {
        const changes = new Map(
          adjustments
            .filter((adjustment) => adjustment.listKind === listKind)
            .map((adjustment) => [adjustment.cardKey, adjustment.remainingQty])
        );
        return cards.flatMap((card) => {
          const remainingQty = changes.get(card.cardKey);
          if (remainingQty === undefined) return [card];
          return remainingQty > 0 ? [{ ...card, qty: remainingQty }] : [];
        });
      };
      setHaves((cards) => applyLocally(cards, 'haves'));
      setWants((cards) => applyLocally(cards, 'wants'));
    },
    [haves, uid, wants]
  );

  const value = useMemo(
    () => ({
      haves,
      wants,
      isLoading,
      errorMessage,
      refresh,
      importCards,
      setQuantity,
      removeCard,
      applyTradeSelections,
    }),
    [
      applyTradeSelections,
      errorMessage,
      haves,
      importCards,
      isLoading,
      refresh,
      removeCard,
      setQuantity,
      wants,
    ]
  );

  return <BinderContext.Provider value={value}>{children}</BinderContext.Provider>;
}

export function useBinder() {
  const context = useContext(BinderContext);
  if (!context) throw new Error('useBinder must be used inside BinderProvider.');
  return context;
}
