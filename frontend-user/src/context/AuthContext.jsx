import React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

function withCredits(user) {
  if (!user) return null;
  return { ...user, credits: user.credits_balance };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('ais_token');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/me')
      .then((res) => setUser(withCredits(res.data?.user)))
      .catch(() => {
        localStorage.removeItem('ais_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('ais_token', token);
      setUser(withCredits(userData));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Check your credentials.';
      setAuthError(message);
      return { success: false, message };
    }
  }, []);

  const signup = useCallback(async ({ name, email, password }) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/signup', { name, email, password });
      const { token, user: userData } = res.data;
      localStorage.setItem('ais_token', token);
      setUser(withCredits(userData));
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Could not create account.';
      setAuthError(message);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ais_token');
    setUser(null);
  }, []);

  const value = {
    user,
    setUser,
    loading,
    authError,
    setAuthError,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
