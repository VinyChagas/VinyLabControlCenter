import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  createOwner as createOwnerRequest,
  getMe,
  getSetupStatus,
  login as loginRequest,
  logout as logoutRequest,
} from '@/api/authApi';
import { ApiError, onUnauthorized } from '@/api/client';
import { AuthContext, type AuthContextValue } from '@/auth/auth-context';
import type { AuthState, AuthUser, SessionScope } from '@/types';

function deriveAuthState(scope: SessionScope | null, user: AuthUser | null): AuthState {
  if (scope === 'setup') return 'setup';
  if (scope === 'user' && user) return 'authenticated';
  return 'anonymous';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [scope, setScope] = useState<SessionScope | null>(null);
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearAuth = useCallback(() => {
    setUser(null);
    setScope(null);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await getSetupStatus();
      setSetupRequired(status.setupRequired);

      try {
        const data = await getMe();
        setScope(data.scope);
        setUser(data.user);
      } catch (err) {
        setUser(null);
        setScope(null);
        if (!(err instanceof ApiError && err.status === 401)) {
          setError(err instanceof Error ? err.message : 'Falha ao validar sessão');
        }
      }
    } catch (err) {
      setSetupRequired(null);
      setUser(null);
      setScope(null);
      setError(err instanceof Error ? err.message : 'Falha ao verificar status do setup');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onUnauthorized(() => {
      setUser(null);
      setScope(null);
    });
    void refresh();
    return () => onUnauthorized(null);
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const data = await loginRequest({ email, password });
    setScope(data.scope);
    setUser(data.user);
    return data.scope;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearAuth();
    }
  }, [clearAuth]);

  const createOwner = useCallback(
    async (input: { name: string; email: string; password: string; confirmPassword: string }) => {
      setError(null);
      await createOwnerRequest(input);
      clearAuth();
      setSetupRequired(false);
    },
    [clearAuth],
  );

  const authState = deriveAuthState(scope, user);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      scope,
      authState,
      setupRequired,
      loading,
      error,
      isAuthenticated: authState === 'authenticated',
      isSetupSession: authState === 'setup',
      login,
      logout,
      createOwner,
      refresh,
      clearAuth,
    }),
    [
      user,
      scope,
      authState,
      setupRequired,
      loading,
      error,
      login,
      logout,
      createOwner,
      refresh,
      clearAuth,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
