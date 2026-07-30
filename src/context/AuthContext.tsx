import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { registerAuthFailureHandler } from '../api/client';
import { queryClient } from '../api/queryClient';
import * as tokenStorage from '../api/tokenStorage';
import type { UserDTO } from '../types/api';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: UserDTO | null;
  status: AuthStatus;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [status, setStatus] = useState<AuthStatus>('idle');

  useEffect(() => {
    function handleAuthFailure() {
      tokenStorage.clearAll();
      queryClient.clear();
      setUser(null);
      setStatus('unauthenticated');
    }
    registerAuthFailureHandler(handleAuthFailure);
  }, []);

  useEffect(() => {
    const accessToken = tokenStorage.getAccessToken();
    if (!accessToken) {
      setStatus('unauthenticated');
      return;
    }
    const persisted = tokenStorage.getPersistedUser();
    if (persisted) {
      setUser(persisted);
      setStatus('authenticated');
    } else {
      setStatus('loading');
    }
    authApi
      .getMe()
      .then((freshUser) => {
        tokenStorage.setPersistedUser(freshUser);
        setUser(freshUser);
        setStatus('authenticated');
      })
      .catch(() => {
        tokenStorage.clearAll();
        setUser(null);
        setStatus('unauthenticated');
      });
  }, []);

  async function login(email: string, password: string) {
    const tokens = await authApi.login(email, password);
    tokenStorage.setAccessToken(tokens.accessToken);
    tokenStorage.setRefreshToken(tokens.refreshToken);
    tokenStorage.setPersistedUser(tokens.user);
    setUser(tokens.user);
    setStatus('authenticated');
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // token may already be dead — proceed with local cleanup regardless
    }
    tokenStorage.clearAll();
    queryClient.clear();
    setUser(null);
    setStatus('unauthenticated');
  }

  return (
    <AuthContext.Provider value={{ user, status, isAdmin: user?.role === 'admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
