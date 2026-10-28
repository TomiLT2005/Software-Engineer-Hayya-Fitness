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
import { useTour } from '../tour/TourContext.jsx';
import { useTourUi } from '../tour/tourBus.js';

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
  const [terminalActiva, setTerminalActiva] = useState(() => {
    const saved = localStorage.getItem('hayya_terminal_activa');
    return saved === 'true';
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const settingsRef = useRef(null);

  const { startPageTour, hasPageTour } = useTour();

  useEffect(() => {
    const onClick = (e) => {
      // Mientras corre el tutorial, el menú de Ajustes lo controla el tour (no el clic afuera)
      if (document.body.classList.contains('driver-active')) return;
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // El guided tour abre el menú de Ajustes para poder mostrar sus opciones directamente
  useTourUi(({ ui }) => {
    setSettingsOpen(ui === 'ajustes');
  });

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
              <span
                className={`ml-1.5 h-2 w-2 rounded-full transition-colors ${
                  terminalActiva
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'bg-red-400/80'
                }`}
                title={terminalActiva ? 'Terminal encendida' : 'Terminal apagada'}
              />
              <ChevronUp className={`ml-auto h-4 w-4 text-gray-400 transition-transform duration-200 ${settingsOpen ? '' : 'rotate-180'}`} />
            </button>

            {settingsOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-line bg-ink-800 p-3 shadow-2xl animate-scale-in">
                {/* Cabecera directa con estado de la Terminal */}
                <div className="mb-2.5 flex items-center justify-between border-b border-line/60 pb-2">
                  <div className="flex items-center gap-2">
                    <MonitorSmartphone className="h-4 w-4 text-brand" />
                    <span className="text-xs font-semibold text-white">Terminal de Acceso</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      terminalActiva
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${terminalActiva ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {terminalActiva ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {/* Control de encendido/apagado directo con switch */}
                <div className="flex items-center justify-between gap-2 rounded-xl bg-ink-900/80 p-2.5 border border-line/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-muted font-medium">Estado del Tótem</span>
                    <span className={`text-xs font-bold ${terminalActiva ? 'text-emerald-400' : 'text-gray-300'}`}>
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
                    className="mt-2.5 flex items-start gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2 text-[11px] leading-relaxed text-amber-300 animate-fade-in"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-400 mt-0.5" />
                    <span>Terminal apagada. Activá el interruptor para habilitar ingresos con DNI.</span>
                  </div>
                )}

                {/* Botón directo para abrir la nueva pestaña */}
                <a
                  id="link-abrir-totem"
                  href="/terminal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-gray-200 transition-all hover:border-brand/40 hover:bg-brand/10 hover:text-white"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-brand" />
                  <span>Abrir en nueva pestaña</span>
                </a>
              </div>
            )}
          </div>

          <button
            type="button"
            id="btn-ayuda"
            onClick={() => (hasPageTour ? startPageTour() : toast('No hay tutorial para esta pantalla'))}
            className={`${itemBase} ${itemIdle}`}
            title="Tutorial guiado de esta sección"
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
