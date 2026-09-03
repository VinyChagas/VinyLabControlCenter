import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/auth/auth-context';

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }
  return value;
}
