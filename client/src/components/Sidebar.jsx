import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  CreditCard,
  Layers,
  Settings,
  LogOut,
  MonitorSmartphone,
  ExternalLink,
  ChevronUp,
  X,
} from 'lucide-react';
import { ClubBadge } from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

const NAV = [
  { to: '/admin/inicio', label: 'Inicio', icon: LayoutGrid },
  { to: '/admin/socios', label: 'Socios', icon: Users },
  { label: 'Pagos', icon: CreditCard, soon: true },
  { label: 'Planes', icon: Layers, soon: true },
];

const itemBase =
  'group relative flex w-full items-center gap-3 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-200';

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast('Sesión cerrada correctamente');
    } catch {
      // logout() ya limpia el estado local aunque falle la red
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <>
      {/* Overlay mobile */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-ink-850 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navegación principal"
      >
        <button onClick={onClose} className="icon-btn absolute right-3 top-3 lg:hidden" aria-label="Cerrar menú">
          <X className="h-4 w-4" />
        </button>

        <div className="flex justify-center pb-8 pt-8">
          <ClubBadge />
        </div>

        <nav className="flex-1 space-y-1.5 px-4">
          {NAV.map(({ to, label, icon: Icon, soon }) =>
            soon ? (
              <div
                key={label}
                className={`${itemBase} cursor-not-allowed border-transparent text-gray-500`}
                aria-disabled="true"
                title="Disponible próximamente"
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
                <span className="ml-auto rounded-md border border-brand/25 bg-brand/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-300">
                  Próximamente
                </span>
              </div>
            ) : (
              <NavLink
                key={label}
                to={to}
                id={`nav-${label.toLowerCase()}`}
                onClick={onClose}
                className={({ isActive }) =>
                  `${itemBase} ${
                    isActive
                      ? 'border-brand bg-brand/10 text-white shadow-[0_0_24px_-8px_rgba(255,85,0,.7)]'
                      : 'border-transparent text-gray-400 hover:bg-white/[0.03] hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-brand' : ''}`} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            )
          )}
        </nav>

        <div className="mx-4 space-y-1 border-t border-line py-4">
          <div className="relative" ref={settingsRef}>
            <button
              id="btn-ajustes"
              onClick={() => setSettingsOpen((v) => !v)}
              className={`${itemBase} border-transparent text-gray-400 hover:bg-white/[0.03] hover:text-white`}
              aria-expanded={settingsOpen}
            >
              <Settings className={`h-[18px] w-[18px] transition-transform duration-500 ${settingsOpen ? 'rotate-90' : ''}`} />
              <span>Ajustes</span>
              <ChevronUp className={`ml-auto h-4 w-4 transition-transform ${settingsOpen ? '' : 'rotate-180'}`} />
            </button>

            {settingsOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-xl border border-line bg-ink-800 p-1.5 shadow-2xl animate-scale-in">
                <a
                  id="link-abrir-totem"
                  href="/terminal"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSettingsOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-200 transition-colors hover:bg-brand/10 hover:text-white"
                >
                  <MonitorSmartphone className="h-4 w-4 text-brand" />
                  <span>Abrir Tótem de Acceso</span>
                  <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-500" />
                </a>
              </div>
            )}
          </div>

          <button
            id="btn-cerrar-sesion"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`${itemBase} border-transparent text-red-400 hover:bg-red-500/10 disabled:opacity-60`}
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>{loggingOut ? 'Cerrando…' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
