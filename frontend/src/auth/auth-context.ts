import { createContext } from 'react';
import type { AuthState, AuthUser, SessionScope } from '@/types';

export interface AuthContextValue {
  user: AuthUser | null;
  scope: SessionScope | null;
  authState: AuthState;
  setupRequired: boolean | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isSetupSession: boolean;
  login: (email: string, password: string) => Promise<SessionScope>;
  logout: () => Promise<void>;
  createOwner: (input: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
