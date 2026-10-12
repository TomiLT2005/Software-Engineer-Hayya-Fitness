import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, ScanLine, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../api/axios';
import { Emblem, Wordmark } from '../components/Logo.jsx';

export default function Login() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/admin/socios" replace />;

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
      navigate(from && from.startsWith('/admin') ? from : '/admin/socios', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión'));
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-ink-900">
      {/* Panel de marca */}
      <section className="relative hidden flex-1 flex-col justify-between overflow-hidden border-r border-line bg-ink-850 p-12 lg:flex">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
        <div className="absolute -left-40 top-1/3 h-[520px] w-[520px] rounded-full bg-brand/20 blur-[140px]" />
        <Emblem className="absolute -bottom-24 -right-24 h-[560px] w-[560px] rotate-[-8deg] text-brand/[0.06]" />

        <div className="relative flex items-center gap-3">
          <Emblem className="h-9 w-9 text-brand" />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-wide">VortexManager</p>
            <p className="text-[11px] tracking-[0.3em] text-muted">HAYYA FITNESS CLUB</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h2 className="text-5xl font-extrabold leading-[1.05] tracking-tight">
            Gestioná tu club con <span className="text-gradient-brand">energía Hayya.</span>
          </h2>
          <p className="mt-5 text-base text-muted">
            Socios, control de acceso por DNI y métricas del día en un solo panel, rápido y seguro.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { icon: Users, t: 'Socios', d: 'Altas y fichas' },
              { icon: ScanLine, t: 'Tótem DNI', d: 'Acceso al instante' },
              { icon: ShieldCheck, t: 'Seguro', d: 'Sesión cifrada' },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-line bg-ink-800/70 p-4 backdrop-blur">
                <Icon className="h-5 w-5 text-brand" />
                <p className="mt-3 text-sm font-semibold">{t}</p>
                <p className="text-xs text-muted">{d}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-gray-600">© {new Date().getFullYear()} Hayya Fitness Club · Todos los derechos reservados</p>
      </section>

      {/* Formulario */}
      <section className="relative flex w-full items-center justify-center px-6 py-12 lg:w-[520px]">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-brand/10 blur-[120px] lg:hidden" />
        <div className="relative w-full max-w-sm animate-slide-up">
          <Wordmark className="mb-10" />

          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-muted">Ingresá con tu cuenta de administrador.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
            {error && (
              <div role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-shake">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="login-correo" className="label">
                Correo electrónico
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
                  className="input py-3 pl-10"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="label">
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
                  className="input py-3 pl-10 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button id="btn-login" type="submit" disabled={submitting} className="btn-primary w-full py-3 text-[15px]">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitting ? 'Ingresando…' : 'Ingresar'}
              {!submitting && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <p className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
            <ShieldCheck className="h-3.5 w-3.5" /> Conexión protegida con cookie HTTP-Only
          </p>
        </div>
      </section>
    </div>
  );
}
