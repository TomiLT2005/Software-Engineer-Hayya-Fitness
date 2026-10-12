import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Emblem } from './Logo.jsx';

export default function ProtectedRoute({ requireAdmin = true }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-900">
        <div className="flex flex-col items-center gap-4">
          <Emblem className="h-12 w-12 animate-pulse text-brand" />
          <p className="text-sm text-muted">Verificando sesión…</p>
        </div>
      </div>
    );
  }

  if (!user || (requireAdmin && user.rol !== 'admin')) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
