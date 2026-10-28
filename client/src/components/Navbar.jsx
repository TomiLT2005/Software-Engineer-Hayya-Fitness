import { Bell, Menu } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ title, subtitle, children }) {
  const { user } = useAuth();
  const ctx = useOutletContext() || {};

  const displayName = user?.rol === 'admin' ? 'Admin' : user?.nombre?.split(' ')[0] || 'Usuario';
  const initials = displayName.slice(0, 2).toUpperCase();
  const roleLabel = user?.rol === 'admin' ? 'Administrativo' : user?.rol || '';

  return (
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <button onClick={ctx.openSidebar} className="icon-btn mt-1 lg:hidden" aria-label="Abrir menú">
          <Menu className="h-4 w-4" />
        </button>
        <div data-tour="page-title">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}
        <button className="icon-btn relative h-10 w-10 rounded-xl" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-brand" />
        </button>

        <div data-tour="navbar-user" className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] py-1.5 pl-1.5 pr-4">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-bold text-gray-200">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-ink-900 bg-emerald-500" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Hola {displayName}!</p>
            <p className="text-[11px] font-medium text-brand">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
