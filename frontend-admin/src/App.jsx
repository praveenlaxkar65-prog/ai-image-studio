import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './context/AdminAuthContext';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import AdminShell from './layouts/AdminShell';

import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import ToolsConfig from './pages/ToolsConfig';
import ProvidersConfig from './pages/ProvidersConfig';
import PricingConfig from './pages/PricingConfig';
import StorageConfig from './pages/StorageConfig';
import Moderation from './pages/Moderation';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import SystemSettings from './pages/SystemSettings';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<AdminLogin />} />

      <Route
        element={
          <AdminProtectedRoute>
            <AdminShell />
          </AdminProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tools" element={<ToolsConfig />} />
        <Route path="/providers" element={<ProvidersConfig />} />
        <Route path="/pricing" element={<PricingConfig />} />
        <Route path="/storage" element={<StorageConfig />} />
        <Route path="/moderation" element={<Moderation />} />
        <Route path="/users" element={<Users />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<SystemSettings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function RootRedirect() {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0B0F]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#26262E] border-t-[#7C5CFC]" />
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}
