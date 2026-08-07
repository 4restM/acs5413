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
import { addStore as addStoreRequest, getStores, seedStores } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import type { NewStore, Store } from '@/types/store';

type StoreContextValue = {
  stores: Store[];
  selectedTradeStore: Store | null;
  isLoading: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
  addStore: (store: NewStore) => Promise<Store>;
  selectTradeStore: (store: Store | null) => void;
};

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({ children }: PropsWithChildren) {
  const { uid, handle } = useIdentity();
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedTradeStore, setSelectedTradeStore] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!uid || !handle) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Seed the built-in shops only when Firebase is empty.
      let loadedStores = await getStores();
      if (loadedStores.length === 0) {
        loadedStores = await seedStores(uid);
      }
      setStores(loadedStores);
    } catch (error: unknown) {
      setErrorMessage(getErrorMessage(error, 'Stores could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, [handle, uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addStore = useCallback(
    async (store: NewStore) => {
      if (!uid) throw new Error('The device identity is not ready.');
      const savedStore = await addStoreRequest(uid, store);
      setStores((current) =>
        [...current, savedStore].sort((left, right) => left.name.localeCompare(right.name))
      );
      return savedStore;
    },
    [uid]
  );

  const value = useMemo(
    () => ({
      stores,
      selectedTradeStore,
      isLoading,
      errorMessage,
      refresh,
      addStore,
      selectTradeStore: setSelectedTradeStore,
    }),
    [addStore, errorMessage, isLoading, refresh, selectedTradeStore, stores]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStores() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStores must be used inside StoreProvider.');
  return context;
}
