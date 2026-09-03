import { createContext } from 'react';
import type { AuthUser } from '@/types';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  clearAuth: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
