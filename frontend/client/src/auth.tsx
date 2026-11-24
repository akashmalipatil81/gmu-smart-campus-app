import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { api, tokenStore, User } from './api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (aadhaar: string, password: string, adminOnly?: boolean) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    api<{ user: User }>('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  async function login(aadhaar: string, password: string, adminOnly = false) {
    const r = await api<{ token: string; user: User }>(adminOnly ? '/auth/admin/login' : '/auth/login', {
      method: 'POST',
      body: { aadhaar, password },
    });
    tokenStore.set(r.token);
    setUser(r.user);
    return r.user;
  }

  function logout() {
    tokenStore.clear();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
