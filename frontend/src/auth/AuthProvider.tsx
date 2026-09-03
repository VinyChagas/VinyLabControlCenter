import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getMe, login as loginRequest, logout as logoutRequest } from '@/api/authApi';
import { ApiError, onUnauthorized } from '@/api/client';
import { AuthContext, type AuthContextValue } from '@/auth/auth-context';
import type { AuthUser } from '@/types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearAuth = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMe();
      setUser(data.user);
    } catch (err) {
      setUser(null);
      if (!(err instanceof ApiError && err.status === 401)) {
        setError(err instanceof Error ? err.message : 'Falha ao validar sessão');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      setUser(null);
    });
    void refresh();
    return () => onUnauthorized(null);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const data = await loginRequest({ email, password });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refresh,
      clearAuth,
    }),
    [user, loading, error, login, logout, refresh, clearAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
