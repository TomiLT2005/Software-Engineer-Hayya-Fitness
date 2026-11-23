import { useState } from 'react';
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
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      {/* Fondo interactivo: matriz de puntitos desde la mitad de la pantalla hacia abajo con hover naranja */}
      <ParticleWave />

      {/* Viñeta radial oscura */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(5,6,8,0.85)_100%)]"
        aria-hidden="true"
      />

      {/* 1. Esquina Superior Izquierda: Logotipo con mayor presencia visual */}
      <div className="fixed left-6 top-6 z-20 flex items-center sm:left-8 sm:top-8">
        <Emblem
          className="h-10 w-10 sm:h-11 sm:w-11 text-white drop-shadow-[0_2px_14px_rgba(255,255,255,0.12)] transition-all duration-200 hover:scale-105 hover:opacity-95"
          title="Hayya Fitness Club"
        />
      </div>

      {/* 2. Esquina Inferior Izquierda: Etiqueta de Acceso Restringido */}
      <div className="fixed bottom-6 left-6 z-20 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-600 sm:bottom-8 sm:left-8">
        ACCESO RESTRINGIDO
      </div>

      {/* 3. Esquina Inferior Derecha: Dominio Oficial */}
      <div className="fixed bottom-6 right-6 z-20 text-[10px] font-bold uppercase tracking-[0.25em] text-gray-600 sm:bottom-8 sm:right-8">
        HAYYAFITNESS.COM
      </div>

      {/* --- TARJETA CENTRAL --- */}
      <div className="relative z-10 w-full max-w-[400px] animate-scale-in">
        {/* Resplandor ambiental naranja muy sutil y tenue en la parte posterior */}
        <div
          className="pointer-events-none absolute -inset-1 rounded-[32px] bg-gradient-to-b from-[#F15A24]/15 via-transparent to-transparent opacity-60 blur-xl"
          aria-hidden="true"
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c0d12]/90 px-7 py-9 shadow-2xl shadow-black/95 backdrop-blur-2xl sm:px-9 sm:py-12">
          {/* Acento en borde superior: micro-gradiente naranja muy tenue (#F15A24) */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#F15A24]/40 to-transparent"
            aria-hidden="true"
          />

          {/* Brillos de esquina sutiles con tonalidad naranja de marca */}
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#F15A24]/[0.07] blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-16 -left-16 h-36 w-36 rounded-full bg-[#F15A24]/[0.03] blur-3xl"
            aria-hidden="true"
          />

          {/* Encabezado: Iniciar sesión + Subtítulo */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-[32px]">
              Iniciar sesión
            </h1>
            <p className="mt-2.5 text-xs text-gray-400 sm:text-[13px]">
              Identificate para continuar.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate className="mt-9 space-y-5 sm:mt-10 sm:space-y-6">
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
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
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
                className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400"
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

            {/* Botón Pill: INGRESAR → con transición y hover naranja sutil de marca */}
            <button
              id="btn-login"
              type="submit"
              disabled={submitting}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-black uppercase tracking-wider text-black shadow-lg shadow-black/20 transition-all duration-300 ease-out hover:bg-[#F15A24] hover:text-white hover:shadow-[0_4px_22px_rgba(241,90,36,0.30)] active:scale-[0.98] active:bg-[#d84815] active:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-current" />
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
          <div className="mt-8 text-center sm:mt-9">
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
