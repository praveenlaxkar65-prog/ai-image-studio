import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';

import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import ToolPlaceholder from './pages/ToolPlaceholder';
import PromptStudio from './pages/PromptStudio';
import Gallery from './pages/Gallery';
import Wallet from './pages/Wallet';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Root just redirects based on auth state */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected app routes — all share the sidebar/topbar shell */}
      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/tools/:toolSlug" element={<ToolPlaceholder />} />
        <Route path="/prompt-studio" element={<PromptStudio />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function RootRedirect() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0B0B0F]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#26262E] border-t-[#7C5CFC]" />
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}
