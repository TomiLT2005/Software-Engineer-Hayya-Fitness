import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  House,
  Users,
  Banknote,
  SlidersHorizontal,
  ChevronUp,
  ChevronDown,
  MonitorCheck,
  Footprints,
  LogOut,
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
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [terminalActiva, setTerminalActiva] = useState(() => {
    const saved = localStorage.getItem('hayya_terminal_activa');
    return saved === 'true';
  });
  const [loggingOut, setLoggingOut] = useState(false);
  const settingsRef = useRef(null);

  const { startPageTour, hasPageTour } = useTour();

  // El guided tour abre el menú de Ajustes para poder mostrar sus opciones directamente
  useTourUi(({ ui }) => {
    if (ui === 'ajustes') setSettingsOpen(true);
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
    e?.stopPropagation?.();
    const next = !terminalActiva;
    setTerminalActiva(next);
    localStorage.setItem('hayya_terminal_activa', String(next));
    window.dispatchEvent(new Event('storage'));
    if (next) {
      toast('Terminal de acceso encendida');
      window.open('/terminal', '_blank');
    } else {
      toast('Terminal de acceso apagada');
    }
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

        <div className="space-y-1.5 px-5 pb-6 pt-2">
          {/* Línea divisoria tal como muestra la imagen de Figma */}
          <div className="my-3 border-t border-line/60" />

          {/* Menú acordeón de Ajustes */}
          <div ref={settingsRef} className="space-y-1">
            <button
              id="btn-ajustes"
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className={`${itemBase} ${settingsOpen ? 'text-white' : itemIdle}`}
              aria-expanded={settingsOpen}
            >
              <SlidersHorizontal className="h-[18px] w-[18px]" />
              <span>Ajustes</span>
              {settingsOpen ? (
                <ChevronUp className="ml-auto h-4 w-4 text-gray-400 transition-transform duration-200" />
              ) : (
                <ChevronDown className="ml-auto h-4 w-4 text-gray-400 transition-transform duration-200" />
              )}
            </button>

            {/* Submenú extendido de Ajustes (inline idéntico a Figma) */}
            {settingsOpen && (
              <div className="space-y-1 pl-4 animate-fade-in">
                {/* Opción Terminal con switch */}
                <div
                  id="switch-terminal"
                  role="button"
                  tabIndex={0}
                  onClick={handleToggleTerminal}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleToggleTerminal();
                    }
                  }}
                  className="group flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-[15px] font-normal text-gray-200 transition-colors hover:bg-white/[0.06] hover:text-white"
                  title={terminalActiva ? 'Apagar terminal' : 'Encender y abrir terminal automáticamente'}
                >
                  <div className="flex items-center gap-3">
                    <MonitorCheck className="h-[18px] w-[18px] text-gray-300 group-hover:text-white" />
                    <span>Terminal</span>
                  </div>

                  {/* Switch toggle estilo Figma */}
                  <div
                    aria-checked={terminalActiva}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out ${
                      terminalActiva ? 'bg-brand' : 'bg-ink-700 border border-white/10'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        terminalActiva ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guía (con ícono Footprints exacto a la imagen) */}
          <button
            type="button"
            id="btn-guia"
            onClick={() => (hasPageTour ? startPageTour() : toast('No hay tutorial para esta pantalla'))}
            className={`${itemBase} ${itemIdle}`}
            title="Guía interactiva de esta sección"
          >
            <Footprints className="h-[18px] w-[18px]" />
            <span>Guía</span>
          </button>

          {/* Cerrar Sesión en rojo idéntico a la imagen */}
          <button
            id="btn-cerrar-sesion"
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className={`${itemBase} text-[#F87171] hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60`}
          >
            <LogOut className="h-[18px] w-[18px] text-[#F87171]" />
            <span>{loggingOut ? 'Cerrando…' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
