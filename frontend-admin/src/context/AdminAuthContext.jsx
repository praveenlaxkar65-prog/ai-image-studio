import React from 'react'; 
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

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
    api
      .get('/auth/me')
      .then((res) => setAdmin(res.data?.admin ?? res.data))
      .catch(() => {
        localStorage.removeItem('ais_admin_token');
        setAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setAuthError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
const { token, user: adminData } = res.data;
if (adminData.role !== 'admin') {
  throw { response: { data: { message: 'This account is not an admin.' } } };
}
      localStorage.setItem('ais_admin_token', token);
      setAdmin(adminData);
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
