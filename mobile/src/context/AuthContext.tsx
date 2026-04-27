import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import {
  ensureRestoredUserAccount,
  observeAuthState,
} from '../services/authService';
import type { AppUserIdentity } from '../types/user';

type AuthContextValue = {
  isAuthenticated: boolean;
  isInitializing: boolean;
  user: AppUserIdentity | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AppUserIdentity | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = observeAuthState((nextUser) => {
      setUser(nextUser);
      setIsInitializing(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    void ensureRestoredUserAccount(user).catch(() => undefined);
  }, [user]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: !!user,
      isInitializing,
      user,
    }),
    [isInitializing, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
