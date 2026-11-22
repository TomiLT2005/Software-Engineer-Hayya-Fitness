import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
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
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#07080c] px-4 py-12 selection:bg-brand/30">
      {/* Fondo interactivo: matriz 3D de puntitos que reaccionan al mouse */}
      <ParticleWave />

      {/* Gradiente sutil ambiental para dar profundidad */}
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(7,8,12,0.85)_100%)]"
        aria-hidden="true"
      />

      {/* Tarjeta central estética con efecto glassmorphism */}
      <div className="relative z-10 w-full max-w-[420px] animate-scale-in">
        {/* Resplandor superior cálido en el logo */}
        <div
          className="pointer-events-none absolute -top-16 left-1/2 h-36 w-64 -translate-x-1/2 rounded-full bg-brand/15 blur-[80px]"
          aria-hidden="true"
        />

        <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0e1017]/85 p-7 shadow-2xl shadow-black/90 backdrop-blur-2xl sm:p-9">
          {/* Borde superior con sutil halo luminoso */}
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

          {/* Logo y Encabezado de Marca */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-brand/25 bg-brand/10 shadow-lg shadow-brand/15">
              <Emblem className="h-8 w-8 text-brand" title="Hayya Fitness Club" />
            </div>

            <div className="flex flex-col items-center leading-none">
              <span className="text-xl font-extrabold tracking-tight text-white">Hayya</span>
              <span className="mt-1 text-[8px] font-semibold tracking-[0.42em] text-gray-400">
                FITNESS CLUB
              </span>
            </div>

            <h1 className="mt-5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
              Iniciar Sesión
            </h1>
            <p className="mt-1 text-xs text-gray-400">
              Ingresá con tu cuenta de administrador para continuar.
            </p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-4">
            {error && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300 animate-shake"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Campo: Correo Electrónico */}
            <div>
              <label
                htmlFor="login-correo"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-correo"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@hayya.com"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-3.5 text-sm text-white placeholder-gray-500 transition-all duration-150 focus:border-brand/70 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-brand/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Campo: Contraseña */}
            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  id="login-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] py-2.5 pl-10 pr-11 text-sm text-white placeholder-gray-500 transition-all duration-150 focus:border-brand/70 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-white"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Botón de Ingreso */}
            <button
              id="btn-login"
              type="submit"
              disabled={submitting}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:bg-brand-600 hover:shadow-brand/40 active:translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Ingresando…</span>
                </>
              ) : (
                <>
                  <span>Ingresar</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>

          {/* Ayuda */}
          <div className="mt-6 border-t border-white/[0.06] pt-5 text-center">
            <p className="text-xs text-gray-400">
              ¿Sin acceso?{' '}
              <span className="font-medium text-gray-300">Pedíselo a un administrador.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
