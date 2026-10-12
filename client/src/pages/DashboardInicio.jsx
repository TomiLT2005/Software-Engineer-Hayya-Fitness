import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  XCircle,
  LogIn,
  MonitorSmartphone,
  ExternalLink,
  RefreshCw,
  Radio,
  Users,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import api, { getErrorMessage } from '../api/axios';
import { formatDni, formatTime, timeAgo } from '../utils/format';

const POLL_MS = 5000;

function KPI({ label, value, icon: Icon, tone, hint, delay }) {
  const t = {
    white: { text: 'text-white', ring: 'border-line bg-ink-750 text-gray-300' },
    green: { text: 'text-emerald-400', ring: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400' },
    red: { text: 'text-red-400', ring: 'border-red-500/25 bg-red-500/10 text-red-400' },
  }[tone];
  return (
    <div className="card relative overflow-hidden p-6 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${t.ring}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-3 text-4xl font-extrabold tabular-nums ${t.text}`}>{value ?? '—'}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}

export default function DashboardInicio() {
  const [resumen, setResumen] = useState(null);
  const [recientes, setRecientes] = useState([]);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [r1, r2] = await Promise.all([api.get('/admin/accesos/resumen'), api.get('/admin/accesos/recientes')]);
      setResumen(r1.data);
      setRecientes(r2.data.data);
      setError('');
      setLastUpdate(new Date());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const tasa = resumen?.total ? Math.round((resumen.permitidos / resumen.total) * 100) : 0;

  const horas = useMemo(() => {
    const map = new Map((resumen?.porHora || []).map((h) => [h.hora, h]));
    const keys = [...map.keys()];
    const from = Math.min(6, ...keys);
    const to = Math.max(23, ...keys);
    const arr = [];
    for (let h = from; h <= to; h += 1) {
      const d = map.get(h) || { permitidos: 0, denegados: 0 };
      arr.push({ hora: h, permitidos: d.permitidos, denegados: d.denegados, total: d.permitidos + d.denegados });
    }
    return arr;
  }, [resumen]);
  const maxHora = Math.max(1, ...horas.map((h) => h.total));
  const horaActual = Number(
    new Date().toLocaleString('es-AR', { hour: 'numeric', hourCycle: 'h23', timeZone: 'America/Argentina/Buenos_Aires' })
  );

  return (
    <>
      <Navbar title="Inicio" subtitle="Resumen operativo del día y control de acceso en vivo">
        <span className="hidden items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-[11px] font-bold tracking-wider text-emerald-400 md:inline-flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-ring" />
          TORNIQUETE #1 OPERATIVO
        </span>
      </Navbar>

      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-[11px] font-bold tracking-wider text-emerald-400 md:hidden">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-ring" />
        TORNIQUETE #1 OPERATIVO
      </span>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <section className="grid gap-4 md:grid-cols-3">
        <KPI label="Total Ingresos" value={resumen?.total} icon={LogIn} tone="white" hint="Intentos registrados hoy" delay={0} />
        <KPI label="Permitidos" value={resumen?.permitidos} icon={CheckCircle2} tone="green" hint={`${tasa}% de aprobación`} delay={60} />
        <KPI label="Denegados" value={resumen?.denegados} icon={XCircle} tone="red" hint="Ficha, membresía o DNI" delay={120} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-3">
        {/* Actividad por hora */}
        <div className="card p-6 xl:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">Afluencia por hora</h2>
              <p className="text-xs text-muted">Ingresos del día en el torniquete principal</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-brand" /> Permitidos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-red-500/70" /> Denegados
              </span>
            </div>
          </div>
          <div className="mt-6 flex h-44 items-end gap-1.5">
            {horas.map((h) => (
              <div key={h.hora} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                <div className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-ink-950 px-2.5 py-1.5 text-[11px] opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                  <b>{String(h.hora).padStart(2, '0')}:00</b> · {h.permitidos} ok · {h.denegados} den.
                </div>
                <div className="flex w-full flex-col justify-end overflow-hidden rounded-md" style={{ height: `${(h.total / maxHora) * 100}%` }}>
                  <div className="w-full bg-red-500/70" style={{ height: h.total ? `${(h.denegados / h.total) * 100}%` : 0 }} />
                  <div className="w-full flex-1 bg-gradient-to-t from-brand to-brand-300 transition-all duration-500 group-hover:brightness-125" />
                </div>
                {h.total === 0 && (
                  <div className={`h-1 w-full rounded-full ${h.hora === horaActual ? 'bg-brand/50' : 'bg-ink-700'}`} />
                )}
                <span className={`mt-2 text-[10px] tabular-nums ${h.hora === horaActual ? 'font-bold text-brand' : 'text-gray-600'}`}>
                  {String(h.hora).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tótem */}
        <div className="card relative flex flex-col overflow-hidden p-6">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand/30 bg-brand/10">
              <MonitorSmartphone className="h-5 w-5 text-brand" />
            </span>
            <div>
              <h2 className="text-base font-bold">Tótem 01</h2>
              <p className="text-xs text-muted">Acceso principal · DNI</p>
            </div>
          </div>
          <div className="relative mt-5 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Motivos de rechazo hoy</p>
            {resumen?.motivos?.length ? (
              resumen.motivos.map((m) => (
                <div key={m.motivo} className="flex items-center justify-between rounded-lg border border-line bg-ink-750/60 px-3 py-2 text-sm">
                  <span className="text-gray-300">{m.motivo}</span>
                  <span className="font-bold text-red-400">{m.total}</span>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-xs text-muted">Sin rechazos hoy 🎉</p>
            )}
          </div>
          <div className="relative mt-auto flex gap-2 pt-5">
            <a href="/terminal" target="_blank" rel="noopener noreferrer" className="btn-primary flex-1" id="btn-abrir-totem">
              Abrir Tótem <ExternalLink className="h-4 w-4" />
            </a>
            <Link to="/admin/socios" className="btn-ghost" title="Ir a Socios">
              <Users className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Últimos ingresos */}
      <section className="card mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 text-brand" />
            <h2 className="text-base font-bold">Últimos ingresos</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
              <Radio className="h-3 w-3 animate-pulse" /> En vivo
            </span>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-xs text-muted hover:text-white" id="btn-refrescar-accesos">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {lastUpdate ? `Actualizado ${formatTime(lastUpdate)}` : 'Cargando…'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead className="bg-ink-850/50">
              <tr>
                <th className="th">Hora</th>
                <th className="th">DNI</th>
                <th className="th">Socio</th>
                <th className="th">Resultado</th>
                <th className="th">Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recientes.map((r) => {
                const ok = r.estado_acceso === 'PERMITIDO';
                return (
                  <tr key={r.id} className="transition-colors hover:bg-white/[0.02] animate-fade-in">
                    <td className="td">
                      <p className="font-mono text-[13px]">{formatTime(r.fecha_hora)}</p>
                      <p className="text-[11px] text-muted">{timeAgo(r.fecha_hora)}</p>
                    </td>
                    <td className="td font-mono text-[13px] text-gray-300">{formatDni(r.dni_ingresado)}</td>
                    <td className="td font-semibold">{r.nombre_socio || <span className="font-normal italic text-gray-500">Desconocido</span>}</td>
                    <td className="td">
                      <span className={ok ? 'badge-success' : 'badge-danger'}>
                        <span className="badge-dot" />
                        {ok ? 'Permitido' : 'Denegado'}
                      </span>
                    </td>
                    <td className="td text-gray-300">{r.motivo}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {resumen && recientes.length === 0 && (
            <div className="px-6 py-14 text-center">
              <p className="text-sm text-muted">Aún no hay ingresos registrados.</p>
              <a href="/terminal" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                Probar el tótem <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
