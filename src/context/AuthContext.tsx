/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isMentor: boolean;
  isParticipant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hackathon_jwt'));
  const [loading, setLoading] = useState<boolean>(true);

  const isAdmin = user?.role === 'admin';
  const isMentor = user?.role === 'mentor';
  const isParticipant = user?.role === 'participant';

  const refreshUser = async () => {
    try {
      const resp = await api.get('/auth/me');
      setUser(resp.data.user);
    } catch (err) {
      console.error('Session expired or invalid token');
      logout();
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        await refreshUser();
      }
      setLoading(false);
    };
    initializeAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const resp = await api.post('/auth/login', { email, password });
      const { token: receivedToken, user: loggedUser } = resp.data;
      localStorage.setItem('hackathon_jwt', receivedToken);
      setToken(receivedToken);
      setUser(loggedUser);
      return loggedUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Login failed');
    }
  };

  const register = async (data: any) => {
    try {
      const resp = await api.post('/auth/register', data);
      const { token: receivedToken, user: registeredUser } = resp.data;
      localStorage.setItem('hackathon_jwt', receivedToken);
      setToken(receivedToken);
      setUser(registeredUser);
      return registeredUser;
    } catch (err: any) {
      throw new Error(err.response?.data?.error || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('hackathon_jwt');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAdmin,
        isMentor,
        isParticipant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
