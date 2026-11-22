import { useState, useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/axios';
import { Emblem } from '../components/Logo.jsx';
import ParticleWave from '../components/ParticleWave.jsx';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  // Reloj en vivo en la esquina superior derecha (como en la referencia)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('es-AR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'America/Argentina/Buenos_Aires',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!loading && user) return <Navigate to="/admin/inicio" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!correo.trim() || !password) {
      setError('Completá correo y contraseña');
      return;
    }
    setSubmitting(true);
    try {
      await login(correo.trim(), password);
      const from = location.state?.from;
      navigate(from && from.startsWith('/admin') ? from : '/admin/inicio', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión'));
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#050608] px-4 py-8 select-none">
      {/* Fondo interactivo de puntitos ondulantes */}
      <ParticleWave />

      {/* Viñeta radial oscura para contraste óptimo */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(5,6,8,0.85)_100%)]"
        aria-hidden="true"
      />

      {/* --- ELEMENTOS PERIFÉRICOS (IDÉNTICOS A LA IMAGEN DE REFERENCIA) --- */}

      {/* 1. Esquina Superior Izquierda: Logotipo */}
      <div className="fixed left-6 top-6 z-20 flex items-center gap-2.5 sm:left-8 sm:top-8">
        <Emblem className="h-7 w-7 text-white transition-opacity hover:opacity-80" title="Hayya Fitness Club" />
      </div>

      {/* 2. Esquina Superior Derecha: Indicador de estado y Reloj en vivo */}
      <div className="fixed right-6 top-6 z-20 flex items-center gap-2 font-mono text-[11px] tracking-widest text-gray-500 sm:right-8 sm:top-8">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>{currentTime || '00:00:00'}</span>
      </div>

      {/* 3. Esquina Inferior Izquierda: Etiqueta de Acceso Restringido */}
      <div className="fixed bottom-6 left-6 z-20 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-600 sm:bottom-8 sm:left-8">
        ACCESO RESTRINGIDO
      </div>

      {/* 4. Esquina Inferior Derecha: Dominio Oficial */}
      <div className="fixed bottom-6 right-6 z-20 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-600 sm:bottom-8 sm:right-8">
        HAYYAFITNESS.COM
      </div>

      {/* --- TARJETA CENTRAL (ESTILO EXACTO A LA REFERENCIA) --- */}
      <div className="relative z-10 w-full max-w-[400px] animate-scale-in">
        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0d12]/90 p-7 shadow-2xl shadow-black/95 backdrop-blur-2xl sm:p-9">
          
          {/* Encabezado: ACCESO + Subtítulo */}
          <div className="text-center">
            <h1 className="text-2xl font-extrabold uppercase tracking-[0.18em] text-white">
              ACCESO
            </h1>
            <p className="mt-1.5 text-xs text-gray-400">
              Identificate para continuar.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 animate-shake"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Campo: CORREO ELECTRÓNICO */}
            <div>
              <label
                htmlFor="login-correo"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
              >
                CORREO ELECTRÓNICO
              </label>
              <input
                id="login-correo"
                type="email"
                autoComplete="username"
                placeholder="admin@hayya.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#12141c]/90 px-4 py-3 text-sm text-white placeholder-gray-600 transition-all duration-150 focus:border-white/30 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-white/20"
                autoFocus
              />
            </div>

            {/* Campo: CONTRASEÑA */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
              >
                CONTRASEÑA
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#12141c]/90 px-4 py-3 pr-11 text-sm text-white placeholder-gray-600 transition-all duration-150 focus:border-white/30 focus:bg-[#151822] focus:outline-none focus:ring-1 focus:ring-white/20"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Casilla: Mantener la sesión iniciada */}
            <div className="pt-0.5">
              <label className="group flex cursor-pointer select-none items-center gap-2.5 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-white/20 bg-white/[0.04] text-white transition-colors focus:ring-0 focus:ring-offset-0 accent-white"
                />
                <span className="transition-colors group-hover:text-gray-300">
                  Mantener la sesión iniciada
                </span>
              </label>
            </div>

            {/* Botón Pill: INGRESAR → */}
            <button
              id="btn-login"
              type="submit"
              disabled={submitting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-white/5 transition-all duration-200 hover:bg-gray-200 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  <span>Ingresando…</span>
                </>
              ) : (
                <>
                  <span>INGRESAR</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Enlace inferior de ayuda */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              ¿Sin acceso?{' '}
              <span className="cursor-pointer text-gray-400 transition-colors hover:text-white">
                Pedíselo a un administrador.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
