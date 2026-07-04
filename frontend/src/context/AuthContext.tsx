import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types';

interface AuthContextType {
  token: string | null;
  currentUser: UserProfile | null;
  globalLoading: boolean;
  login: (newToken: string) => void;
  logout: () => void;
  setGlobalLoading: (loading: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE || '';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('eams_token'));
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [globalLoading, setGlobalLoading] = useState<boolean>(false);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setCurrentUser(null);
        return;
      }
      setGlobalLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const user = await res.json();
          setCurrentUser(user);
        } else {
          logout();
        }
      } catch (e) {
        console.error('Auth verification failed', e);
        logout();
      } finally {
        setGlobalLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('eams_token', newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem('eams_token');
    setToken(null);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        currentUser,
        globalLoading,
        login,
        logout,
        setGlobalLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
