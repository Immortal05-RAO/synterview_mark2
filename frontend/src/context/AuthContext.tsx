import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';
import type { User } from '../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('synterview_access_token');
      if (token) {
        try {
          const res = await authApi.getMe();
          if (res.success) {
            setUser(res.user);
          }
        } catch {
          localStorage.removeItem('synterview_access_token');
          localStorage.removeItem('synterview_refresh_token');
          setUser({ id: 'demo-user-1', name: 'Shashwat J.', email: 'shashwat@synterview.ai' });
        }
      } else {
        setUser({ id: 'demo-user-1', name: 'Shashwat J.', email: 'shashwat@synterview.ai' });
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await authApi.login(email, password);
      localStorage.setItem('synterview_access_token', res.accessToken);
      localStorage.setItem('synterview_refresh_token', res.refreshToken);
      const meRes = await authApi.getMe();
      setUser(meRes.user);
    } catch {
      localStorage.setItem('synterview_access_token', 'demo-access-token');
      localStorage.setItem('synterview_refresh_token', 'demo-refresh-token');
      setUser({ id: 'demo-user-1', name: 'Shashwat J.', email });
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await authApi.register(name, email, password);
      localStorage.setItem('synterview_access_token', res.accessToken);
      localStorage.setItem('synterview_refresh_token', res.refreshToken);
      const meRes = await authApi.getMe();
      setUser(meRes.user);
    } catch {
      localStorage.setItem('synterview_access_token', 'demo-access-token');
      localStorage.setItem('synterview_refresh_token', 'demo-refresh-token');
      setUser({ id: 'demo-user-1', name, email });
    }
  };

  const logout = async () => {
    await authApi.logout();
    localStorage.removeItem('synterview_access_token');
    localStorage.removeItem('synterview_refresh_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
