import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, currentUser, currentCompany, token, type User, type Company, type AuthResponse } from '../lib/api';

interface AuthContextType {
  user: User | null;
  company: Company | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (response: AuthResponse) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setCompany: (c: Company) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(currentUser.get());
  const [company, setCompanyState] = useState<Company | null>(currentCompany.get());
  const [isLoading, setIsLoading] = useState(false);

  // При монтировании проверяем токен
  useEffect(() => {
    const t = token.get();
    if (t && !user) {
      refreshUser();
    }

    // Когда refresh тоже истёк — разлогиниваем
    const handleExpired = () => {
      token.clear();
      setUser(null);
      setCompanyState(null);
    };
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (response: AuthResponse) => {
    token.set(response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    currentUser.set(response.user);
    setUser(response.user);
  };

  const logout = () => {
    token.clear();
    setUser(null);
    setCompanyState(null);
  };

  const refreshUser = async () => {
    try {
      setIsLoading(true);
      const me = await auth.me();
      currentUser.set(me);
      setUser(me);
    } catch {
      // Токен устарел
      token.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const setCompany = (c: Company) => {
    currentCompany.set(c);
    setCompanyState(c);
  };

  return (
    <AuthContext.Provider value={{
      user,
      company,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      refreshUser,
      setCompany,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
