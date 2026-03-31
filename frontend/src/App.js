import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import useUIStore from './stores/uiStore';
import { LandingPage, HistoryPage, SettingsPage } from './pages/OtherPages';
import LoginPage from './pages/LoginPage';
import { SignupPage, VerifyEmailPage, ForgotPasswordPage, ResetPasswordPage } from './pages/AuthPages';
import ChatPage from './pages/ChatPage';
import LogsPage from './pages/LogsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated()) return <Navigate to="/chat" replace />;
  return children;
}

function ForceDarkMode({ children }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    return () => {
      document.documentElement.setAttribute('data-theme', useUIStore.getState().theme || 'dark');
    };
  }, []);
  return children;
}

export default function App() {
  const { theme } = useUIStore();
  const { token, fetchMe } = useAuthStore();
  
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  
  // Sync user state on load if logged in
  useEffect(() => {
    if (token) fetchMe();
  }, [token, fetchMe]);

  return (
    <Routes>
      <Route path="/" element={<ForceDarkMode><LandingPage /></ForceDarkMode>} />
      <Route path="/login" element={<PublicOnlyRoute><ForceDarkMode><LoginPage /></ForceDarkMode></PublicOnlyRoute>} />
      <Route path="/signup" element={<PublicOnlyRoute><ForceDarkMode><SignupPage /></ForceDarkMode></PublicOnlyRoute>} />
      <Route path="/verify-email" element={<ForceDarkMode><VerifyEmailPage /></ForceDarkMode>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForceDarkMode><ForgotPasswordPage /></ForceDarkMode></PublicOnlyRoute>} />
      <Route path="/reset-password/:token" element={<ForceDarkMode><ResetPasswordPage /></ForceDarkMode>} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/chat/:conversationId" element={<ChatPage />} />
      <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/admin/logs" element={<ProtectedRoute><LogsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
