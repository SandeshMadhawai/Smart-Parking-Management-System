export default function ProtectedRoute({ children, role }) {
  const { token, userType, user, hasHydrated } = useAuthStore();

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to={role === 'guard' ? '/guard/login' : '/admin/login'} replace />;
  }

  if (role === 'admin') {
    const isAdmin = userType === 'organization' || user?.role === 'admin';
    if (!isAdmin) return <Navigate to="/guard/dashboard" replace />;
  }

  return children;
}