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
import { createTrade, getTradeHistory } from '@/lib/api';
import type { NewTrade, TradeRecord } from '@/types/trade';

type TradeContextValue = {
  trades: TradeRecord[];
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  recordTrade: (trade: NewTrade) => Promise<TradeRecord>;
};

const TradeContext = createContext<TradeContextValue | undefined>(undefined);

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : 'Trade history could not be loaded.';
}

export function TradeProvider({ children }: PropsWithChildren) {
  const { uid, handle } = useIdentity();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid || !handle) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setTrades(await getTradeHistory(uid));
    } catch (error: unknown) {
      setErrorMessage(messageFromError(error));
    } finally {
      setIsLoading(false);
    }
  }, [handle, uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recordTrade = useCallback(
    async (trade: NewTrade) => {
      if (!uid || !handle) throw new Error('The device identity is not ready.');
      const savedTrade = await createTrade(uid, handle, trade);
      setTrades((current) => [savedTrade, ...current]);
      return savedTrade;
    },
    [handle, uid]
  );

  const value = useMemo(
    () => ({ trades, isLoading, errorMessage, refresh, recordTrade }),
    [errorMessage, isLoading, recordTrade, refresh, trades]
  );

  return <TradeContext.Provider value={value}>{children}</TradeContext.Provider>;
}

export function useTrades() {
  const context = useContext(TradeContext);
  if (!context) throw new Error('useTrades must be used inside TradeProvider.');
  return context;
}
