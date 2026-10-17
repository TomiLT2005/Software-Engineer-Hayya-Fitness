import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  House,
  Users,
  Banknote,
  SlidersHorizontal,
  CircleHelp,
  LogOut,
  MonitorSmartphone,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  X,
} from 'lucide-react';
import { HorizontalLogo } from './Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/** Ícono de 4 círculos (Planes), estilo lucide */
function FourCircles({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <circle cx="7" cy="7" r="3.5" />
      <circle cx="17" cy="7" r="3.5" />
      <circle cx="7" cy="17" r="3.5" />
      <circle cx="17" cy="17" r="3.5" />
    </svg>
  );
}

const NAV = [
  { to: '/admin/inicio', label: 'Inicio', icon: House },
  { to: '/admin/socios', label: 'Socios', icon: Users },
  { to: '/admin/pagos', label: 'Pagos', icon: Banknote },
  { to: '/admin/planes', label: 'Planes', icon: FourCircles },
];

const itemBase =
  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-normal transition-all duration-200';
const itemIdle = 'text-gray-100 hover:bg-white/[0.06] hover:text-white';

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [terminalMenuOpen, setTerminalMenuOpen] = useState(false);
  const [terminalActiva, setTerminalActiva] = useState(() => {
    const saved = localStorage.getItem('hayya_terminal_activa');
    return saved === 'true';
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (!e.key || e.key === 'hayya_terminal_activa') {
        const val = localStorage.getItem('hayya_terminal_activa');
        setTerminalActiva(val === 'true');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleToggleTerminal = (e) => {
    e.stopPropagation();
    const next = !terminalActiva;
    setTerminalActiva(next);
    localStorage.setItem('hayya_terminal_activa', String(next));
    window.dispatchEvent(new Event('storage'));
    toast(next ? 'Terminal de acceso encendida' : 'Terminal de acceso apagada');
  };

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

        <div className="flex justify-center px-5 pb-14 pt-7">
          <HorizontalLogo />
        </div>

        <nav className="flex-1 space-y-2 px-5">
          {NAV.map(({ to, label, icon: Icon, soon }) =>
            soon ? (
              <button
                type="button"
                key={label}
                id={`nav-${label.toLowerCase()}`}
                onClick={() => toast('Pagos estará disponible próximamente')}
                className={`${itemBase} ${itemIdle}`}
                title="Disponible próximamente"
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </button>
            ) : (
              <NavLink
                key={label}
                to={to}
                id={`nav-${label.toLowerCase()}`}
                onClick={onClose}
                className={({ isActive }) =>
                  `${itemBase} ${
                    isActive
                      ? 'bg-brand text-white'
                      : itemIdle
                  }`
                }
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="space-y-2 px-5 pb-6 pt-4">
          <div className="relative" ref={settingsRef}>
            <button
              id="btn-ajustes"
              onClick={() => setSettingsOpen((v) => !v)}
              className={`${itemBase} ${settingsOpen ? 'bg-white/[0.06] text-white' : itemIdle}`}
              aria-expanded={settingsOpen}
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
              <span>Ajustes</span>
              <ChevronUp className={`ml-auto h-4 w-4 text-gray-400 transition-transform ${settingsOpen ? '' : 'rotate-180'}`} />
            </button>

            {settingsOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-line bg-ink-800 p-2 shadow-xl animate-scale-in">
                {/* Apartado Terminal */}
                <div className="rounded-xl border border-line bg-ink-750/60 overflow-hidden">
                  <button
                    type="button"
                    id="btn-apartado-terminal"
                    onClick={() => setTerminalMenuOpen((v) => !v)}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-gray-200 transition-colors hover:bg-white/[0.04]"
                    aria-expanded={terminalMenuOpen}
                  >
                    <MonitorSmartphone className="h-4 w-4 text-brand" />
                    <span>Terminal</span>
                    <span
                      className={`ml-1.5 h-1.5 w-1.5 rounded-full ${
                        terminalActiva ? 'bg-emerald-400' : 'bg-red-400'
                      }`}
                    />
                    <ChevronDown
                      className={`ml-auto h-3.5 w-3.5 text-gray-400 transition-transform duration-200 ${
                        terminalMenuOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {terminalMenuOpen && (
                    <div className="border-t border-line/60 bg-ink-900/70 p-2.5 space-y-2.5 animate-fade-in">
                      {/* Opción 1: Interruptor para encender / apagar */}
                      <div className="flex items-center justify-between gap-2 px-1 pt-0.5">
                        <div className="flex flex-col">
                          <span className="text-[11px] uppercase tracking-wider text-muted">Estado</span>
                          <span className={`text-xs font-bold ${terminalActiva ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {terminalActiva ? 'Encendida' : 'Apagada'}
                          </span>
                        </div>

                        <button
                          type="button"
                          id="switch-terminal"
                          role="switch"
                          aria-checked={terminalActiva}
                          onClick={handleToggleTerminal}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 focus:ring-offset-ink-900 ${
                            terminalActiva ? 'bg-brand' : 'bg-ink-700'
                          }`}
                          title={terminalActiva ? 'Apagar terminal' : 'Encender terminal'}
                        >
                          <span className="sr-only">Activar o desactivar terminal</span>
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              terminalActiva ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Mensaje de advertencia si la terminal está apagada */}
                      {!terminalActiva && (
                        <div
                          role="alert"
                          className="flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-2 text-[11px] leading-relaxed text-amber-300 animate-fade-in"
                        >
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                          <span>La terminal no fue encendida. Activá el interruptor para habilitar ingresos.</span>
                        </div>
                      )}

                      {/* Opción 2: Botón para abrir la nueva pestaña */}
                      <a
                        id="link-abrir-totem"
                        href="/terminal"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-gray-200 transition-all hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-brand" />
                        <span>Abrir en nueva pestaña</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            id="btn-ayuda"
            onClick={() => toast('La sección de ayuda estará disponible próximamente')}
            className={`${itemBase} ${itemIdle}`}
          >
            <CircleHelp className="h-[18px] w-[18px]" />
            <span>Ayuda</span>
          </button>

          <button
            id="btn-cerrar-sesion"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`${itemBase} text-[#F87171] hover:bg-red-500/5 hover:text-red-300 disabled:opacity-60`}
          >
            <LogOut className="h-[18px] w-[18px]" />
            <span>{loggingOut ? 'Cerrando…' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
