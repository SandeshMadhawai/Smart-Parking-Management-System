import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from './pages/Home';

// Admin
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAreas from './pages/admin/AdminAreas';
import AdminSlots from './pages/admin/AdminSlots';
import AdminSessions from './pages/admin/AdminSessions';
import AdminGuards from './pages/admin/AdminGuards';
import AdminSettings from './pages/admin/AdminSettings';

// Guard
import GuardLogin from './pages/guard/GuardLogin';
import GuardDashboard from './pages/guard/GuardDashboard';
import GuardSessions from './pages/guard/GuardSessions';

// Owner (public QR)
import SessionView from './pages/owner/SessionView';

// Shared
import ProtectedRoute from './components/shared/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/guard/login" element={<GuardLogin />} />

      {/* QR scan - no auth */}
      <Route path="/session/:token" element={<SessionView />} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/areas" element={
        <ProtectedRoute role="admin"><AdminAreas /></ProtectedRoute>
      } />
      <Route path="/admin/slots" element={
        <ProtectedRoute role="admin"><AdminSlots /></ProtectedRoute>
      } />
      <Route path="/admin/sessions" element={
        <ProtectedRoute role="admin"><AdminSessions /></ProtectedRoute>
      } />
      <Route path="/admin/guards" element={
        <ProtectedRoute role="admin"><AdminGuards /></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>
      } />

      {/* Guard routes */}
      <Route path="/guard/dashboard" element={
        <ProtectedRoute role="guard"><GuardDashboard /></ProtectedRoute>
      } />
      <Route path="/guard/sessions" element={
        <ProtectedRoute role="guard"><GuardSessions /></ProtectedRoute>
      } />

      {/* Fallbacks */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/guard" element={<Navigate to="/guard/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
