import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { saveProfile } from '@/lib/api';
import { loadOrCreateIdentity, saveLocalHandle } from '@/lib/identity';

type IdentityContextValue = {
  uid: string | null;
  handle: string | null;
  isLoading: boolean;
  bootstrapError: string | null;
  completeOnboarding: (handle: string) => Promise<void>;
};

const IdentityContext = createContext<IdentityContextValue | undefined>(undefined);

function messageFromError(error: unknown) {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

export function IdentityProvider({ children }: PropsWithChildren) {
  const [uid, setUid] = useState<string | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    loadOrCreateIdentity()
      .then((identity) => {
        setUid(identity.uid);
        setHandle(identity.handle);
      })
      .catch((error: unknown) => {
        console.error('Identity bootstrap failed:', error);
        setBootstrapError(messageFromError(error));
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

  const value = useMemo(
    () => ({ uid, handle, isLoading, bootstrapError, completeOnboarding }),
    [bootstrapError, completeOnboarding, handle, isLoading, uid]
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
