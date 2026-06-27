import React from 'react';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../services/api';

// `api` is scoped to /api/admin for all admin-only endpoints.
// Login/session-restore are shared, non-admin-prefixed routes (/api/auth/...),
// so they need a separate instance pointed one level up.
const authBaseURL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/admin\/?$/, '');
const authApi = axios.create({ baseURL: authBaseURL });

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('ais_admin_token');
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setAdmin(res.data?.user))
      .catch(() => {
        localStorage.removeItem('ais_admin_token');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const res = await authApi.post('/auth/login', { email, password });
      const { token, user: userData } = res.data;

      if (userData.role !== 'admin') {
        throw { response: { data: { message: 'This account is not an admin.' } } };
      }

      localStorage.setItem('ais_admin_token', token);
      setAdmin(userData);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Invalid credentials.';
      setAuthError(message);
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ais_admin_token');
    setAdmin(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ admin, loading, authError, setAuthError, isAuthenticated: !!admin, login, logout }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
