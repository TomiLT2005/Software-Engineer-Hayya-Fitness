import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Delete, Check, Maximize, Minimize, ShieldCheck, ShieldX, ShieldAlert, Loader2, Trophy, HeartPulse, UserX, CircleSlash, LayoutGrid } from 'lucide-react';
import api, { getErrorMessage } from '../api/axios';
import { Emblem } from '../components/Logo.jsx';
import { formatDni } from '../utils/format';

const TZ = 'America/Argentina/Buenos_Aires';
const RESULT_MS = 5000;
const MAX_LEN = 10;

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

/** "MIÉRCOLES, 7 OCT" */
function formatFecha(d) {
  const weekday = d.toLocaleDateString('es-AR', { weekday: 'long', timeZone: TZ });
  const day = d.toLocaleDateString('es-AR', { day: 'numeric', timeZone: TZ });
  const month = d.toLocaleDateString('es-AR', { month: 'short', timeZone: TZ }).replace('.', '');
  return `${weekday}, ${day} ${month}`.toUpperCase();
}
const formatHora = (d) => d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: TZ });

const RESULT_UI = {
  ok: {
    icon: ShieldCheck,
    title: 'ACCESO PERMITIDO',
    bg: 'from-emerald-500/25 via-emerald-500/5',
    ring: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-400 shadow-[0_0_80px_-10px_rgba(16,185,129,.8)]',
    text: 'text-emerald-400',
    bar: 'bg-emerald-400',
  },
  ficha: {
    icon: ShieldAlert,
    title: 'ACCESO DENEGADO',
    bg: 'from-amber-500/25 via-amber-500/5',
    ring: 'border-amber-400/60 bg-amber-500/15 text-amber-400 shadow-[0_0_80px_-10px_rgba(245,158,11,.8)]',
    text: 'text-amber-400',
    bar: 'bg-amber-400',
    reasonIcon: HeartPulse,
    help: 'Acercate a recepción para entregar tu ficha médica.',
  },
  inactivo: {
    icon: ShieldX,
    title: 'ACCESO DENEGADO',
    bg: 'from-red-500/25 via-red-500/5',
    ring: 'border-red-400/60 bg-red-500/15 text-red-400 shadow-[0_0_80px_-10px_rgba(239,68,68,.8)]',
    text: 'text-red-400',
    bar: 'bg-red-400',
    reasonIcon: CircleSlash,
    help: 'Tu membresía no está activa. Consultá en recepción.',
  },
  no_registrado: {
    icon: ShieldX,
    title: 'ACCESO DENEGADO',
    bg: 'from-red-500/25 via-red-500/5',
    ring: 'border-red-400/60 bg-red-500/15 text-red-400 shadow-[0_0_80px_-10px_rgba(239,68,68,.8)]',
    text: 'text-red-400',
    bar: 'bg-red-400',
    reasonIcon: UserX,
    help: 'Verificá el número o registrate en recepción.',
  },
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];

export default function TotemAcceso() {
  const now = useClock();
  const [dni, setDni] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [pressed, setPressed] = useState(null);
  const [isFull, setIsFull] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    document.title = 'Tótem de Acceso · Hayya Fitness Club';
    const onFs = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      clearTimeout(timer.current);
    };
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    setResult(null);
    setDni('');
    setError('');
  }, []);

  const submit = useCallback(async () => {
    if (loading || result) return;
    if (dni.length < 6) {
      setError('El DNI debe tener al menos 6 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/acceso/validar', { dni });
      setResult({ ...data, dni });
      timer.current = setTimeout(reset, RESULT_MS);
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo validar el acceso'));
    } finally {
      setLoading(false);
    }
  }, [dni, loading, result, reset]);

  const press = useCallback(
    (k) => {
      setPressed(k);
      setTimeout(() => setPressed(null), 120);
      if (result) {
        reset();
        return;
      }
      setError('');
      if (k === 'del') setDni((d) => d.slice(0, -1));
      else if (k === 'ok') submit();
      else if (k === 'clear') setDni('');
      else setDni((d) => (d.length < MAX_LEN ? d + k : d));
    },
    [result, reset, submit]
  );

  // Teclado físico
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
      else if (e.key === 'Escape') press('clear');
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const ui = result ? RESULT_UI[result.tipo] || RESULT_UI.no_registrado : null;

  return (
    <main className="relative flex min-h-screen select-none flex-col overflow-hidden bg-ink-950 text-white">
      {/* Fondo */}
      <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-[160px]" />
      <Emblem className="absolute -bottom-32 -left-32 h-[520px] w-[520px] text-white/[0.02]" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <Emblem className="h-9 w-9 text-brand" />
          <div className="leading-tight">
            <p className="text-lg font-extrabold">Hayya</p>
            <p className="text-[9px] tracking-[0.4em] text-muted">FITNESS CLUB</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-[11px] font-bold tracking-wider text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-ring" />
          TÓTEM 01 • ACCESO PRINCIPAL
        </span>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/inicio"
            className="icon-btn h-10 w-10 rounded-xl"
            title="Volver al Panel Administrativo"
            aria-label="Volver al Panel"
          >
            <LayoutGrid className="h-4 w-4 text-brand" />
          </Link>
          <button onClick={toggleFullscreen} className="icon-btn h-10 w-10 rounded-xl" aria-label="Pantalla completa" id="btn-fullscreen">
            {isFull ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold tracking-[0.25em] text-muted">{formatFecha(now)}</p>
          <p className="mt-1 font-mono text-6xl font-semibold tabular-nums tracking-tight sm:text-7xl">
            {formatHora(now)}
          </p>
        </div>

        <div className="w-full max-w-md">
          <h1 className="text-center text-2xl font-bold">Ingresá tu DNI</h1>
          <p className="mt-1 text-center text-sm text-muted">Usá el teclado en pantalla o tu teclado físico</p>

          {/* Display */}
          <div
            className={`mt-6 flex h-20 items-center justify-center rounded-2xl border-2 bg-ink-800/80 px-6 backdrop-blur transition-colors ${
              error ? 'border-red-500/60 animate-shake' : dni ? 'border-brand/60 shadow-glow' : 'border-line'
            }`}
            aria-live="polite"
          >
            {dni ? (
              <span className="font-mono text-4xl font-semibold tracking-[0.12em]">{formatDni(dni)}</span>
            ) : (
              <span className="font-mono text-3xl tracking-[0.2em] text-gray-700">__.___.___</span>
            )}
            {!loading && <span className="ml-1 h-9 w-0.5 animate-pulse bg-brand" />}
          </div>
          <p className={`mt-2 h-5 text-center text-sm text-red-400 transition-opacity ${error ? 'opacity-100' : 'opacity-0'}`}>{error}</p>

          {/* Keypad */}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {KEYS.map((k) => {
              const isOk = k === 'ok';
              const isDel = k === 'del';
              return (
                <button
                  key={k}
                  id={`key-${k}`}
                  onClick={() => press(k)}
                  disabled={loading || (isOk && dni.length < 6)}
                  className={`flex h-[72px] items-center justify-center rounded-2xl border text-2xl font-semibold transition-all duration-100 active:scale-95 disabled:opacity-40 ${
                    isOk
                      ? 'border-brand bg-gradient-to-b from-brand-400 to-brand text-white shadow-glow-sm hover:shadow-glow'
                      : isDel
                        ? 'border-line bg-ink-800 text-gray-400 hover:bg-ink-750 hover:text-white'
                        : 'border-line bg-ink-800/90 hover:border-line-strong hover:bg-ink-750'
                  } ${pressed === k ? 'scale-95 brightness-125' : ''}`}
                  aria-label={isOk ? 'Ingresar' : isDel ? 'Borrar' : k}
                >
                  {isOk ? (
                    loading ? <Loader2 className="h-7 w-7 animate-spin" /> : <Check className="h-7 w-7" strokeWidth={3} />
                  ) : isDel ? (
                    <Delete className="h-6 w-6" />
                  ) : (
                    k
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Resultado */}
      {result && ui && (
        <div
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center bg-ink-950/95 px-6 backdrop-blur-xl animate-fade-in"
          onClick={reset}
          role="alertdialog"
          aria-live="assertive"
        >
          <div className={`absolute inset-0 bg-gradient-to-b ${ui.bg} to-transparent`} />
          <div className="relative flex flex-col items-center text-center animate-scale-in">
            <div className={`flex h-36 w-36 items-center justify-center rounded-full border-4 ${ui.ring}`}>
              <ui.icon className="h-20 w-20" strokeWidth={1.8} />
            </div>
            <p className={`mt-8 text-4xl font-extrabold tracking-wide sm:text-5xl ${ui.text}`}>{ui.title}</p>

            {result.socio ? (
              <p className="mt-4 text-2xl font-semibold sm:text-3xl">
                {result.tipo === 'ok' ? '¡Bienvenido/a, ' : ''}
                {result.socio.nombre} {result.socio.apellido}
                {result.tipo === 'ok' ? '!' : ''}
              </p>
            ) : (
              <p className="mt-4 font-mono text-2xl text-gray-300">DNI {formatDni(result.dni)}</p>
            )}

            {result.tipo === 'ok' ? (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <span className="rounded-full border border-line bg-ink-800 px-4 py-2 text-sm text-gray-300">Plan {result.socio.plan}</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-4 py-2 text-sm font-semibold text-brand-300">
                  <Trophy className="h-4 w-4" /> +{result.socio.puntosGanados} pts · {result.socio.puntos} totales
                </span>
              </div>
            ) : (
              <>
                <div className={`mt-6 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-lg font-bold ${ui.text}`}>
                  {ui.reasonIcon && <ui.reasonIcon className="h-5 w-5" />}
                  {result.motivo}
                </div>
                <p className="mt-3 text-sm text-muted">{ui.help}</p>
              </>
            )}

            <p className="mt-10 text-xs uppercase tracking-[0.3em] text-gray-600">Tocá la pantalla para continuar</p>
          </div>
          <span
            className={`absolute bottom-0 left-0 h-1.5 w-full origin-left animate-shrink ${ui.bar}`}
            style={{ animationDuration: `${RESULT_MS}ms` }}
          />
        </div>
      )}
    </main>
  );
}
