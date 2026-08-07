import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { saveProfile, updateHomeStore } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import {
  loadOrCreateIdentity,
  saveLocalHandle,
  saveLocalHomeStore,
} from '@/lib/identity';

type IdentityContextValue = {
  uid: string | null;
  handle: string | null;
  homeStoreId: string | null;
  isLoading: boolean;
  bootstrapError: string | null;
  completeOnboarding: (handle: string) => Promise<void>;
  setHomeStore: (storeId: string) => Promise<void>;
};

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

export function IdentityProvider({ children }: PropsWithChildren) {
  const [uid, setUid] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [homeStoreId, setHomeStoreId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    loadOrCreateIdentity()
      .then((identity) => {
        setUid(identity.uid);
        setHandle(identity.handle);
        setHomeStoreId(identity.homeStoreId);
      })
      .catch((error: unknown) => {
        console.error('Identity bootstrap failed:', error);
        setBootstrapError(getErrorMessage(error, 'An unexpected error occurred.'));
      })
      .finally(() => setIsLoading(false));
  }, []);

  const completeOnboarding = useCallback(
    async (newHandle: string) => {
      if (!uid) {
        throw new Error('The device identity is not ready. Restart the app and try again.');
      }

      const normalizedHandle = newHandle.trim();
      await saveProfile(uid, {
        handle: normalizedHandle,
        createdAt: new Date().toISOString(),
      });
      await saveLocalHandle(normalizedHandle);
      setHandle(normalizedHandle);
    },
    [uid]
  );

  const setHomeStore = useCallback(
    async (storeId: string) => {
      if (!uid) throw new Error('The device identity is not ready.');
      await updateHomeStore(uid, storeId);
      await saveLocalHomeStore(storeId);
      setHomeStoreId(storeId);
    },
    [uid]
  );

  const value = useMemo(
    () => ({
      uid,
      handle,
      homeStoreId,
      isLoading,
      bootstrapError,
      completeOnboarding,
      setHomeStore,
    }),
    [
      bootstrapError,
      completeOnboarding,
      handle,
      homeStoreId,
      isLoading,
      setHomeStore,
      uid,
    ]
  );

  return <IdentityContext.Provider value={value}>{children}</IdentityContext.Provider>;
}

export function useIdentity() {
  const context = useContext(IdentityContext);
  if (!context) {
    throw new Error('useIdentity must be used inside IdentityProvider.');
  }
  return context;
}
