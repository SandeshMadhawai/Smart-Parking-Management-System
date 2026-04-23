import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function ProtectedRoute({ children, role }) {
  const { token, userType, user } = useAuthStore();

  if (!token) {
    return <Navigate to={role === 'guard' ? '/guard/login' : '/admin/login'} replace />;
  }

  if (role === 'admin') {
    const isAdmin = userType === 'organization' || user?.role === 'admin';
    if (!isAdmin) return <Navigate to="/guard/dashboard" replace />;
  }

  return children;
}