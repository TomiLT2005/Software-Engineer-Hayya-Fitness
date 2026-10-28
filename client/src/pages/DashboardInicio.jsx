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
  AlertCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import api, { getErrorMessage } from '../api/axios';
import { formatDni, formatTime, timeAgo } from '../utils/format';

const POLL_MS = 5000;

function KPI({ label, value, icon: Icon, tone, hint, delay }) {
  const t = {
    white: { text: 'text-white', ring: 'border-white/10 bg-white/[0.03] text-gray-400' },
    green: { text: 'text-emerald-400', ring: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400' },
    red: { text: 'text-red-400', ring: 'border-red-500/25 bg-red-500/5 text-red-400' },
  }[tone];
  return (
    <div className="card relative min-w-0 overflow-hidden px-4 py-3 sm:px-5 sm:py-3.5" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${t.ring}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className={`mt-1.5 text-2xl sm:text-[28px] font-bold tabular-nums tracking-tight ${t.text}`}>{value ?? '—'}</p>
      <p className="mt-0.5 text-[11px] text-muted">{hint}</p>
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
        <span className="hidden items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-[11px] font-bold tracking-wider text-emerald-400 md:inline-flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          TORNIQUETE #1 OPERATIVO
        </span>
      </Navbar>

      <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-[11px] font-bold tracking-wider text-emerald-400 md:hidden">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        TORNIQUETE #1 OPERATIVO
      </span>

      {error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <section data-tour="inicio-kpis" className="grid min-w-0 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <KPI label="Total Ingresos" value={resumen?.total} icon={LogIn} tone="white" hint="Intentos registrados hoy" delay={0} />
        <KPI label="Permitidos" value={resumen?.permitidos} icon={CheckCircle2} tone="green" hint={`${tasa}% de aprobación`} delay={60} />
        <div className="sm:col-span-2 md:col-span-1">
          <KPI label="Denegados" value={resumen?.denegados} icon={XCircle} tone="red" hint="Ficha, membresía o DNI" delay={120} />
        </div>
      </section>

      <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
        {/* Actividad por hora */}
        <div data-tour="inicio-afluencia" className="card min-w-0 overflow-hidden p-4 sm:p-5 xl:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <div className="mt-5 overflow-x-auto pb-1 -mx-1 px-1">
            <div className="flex h-36 min-w-[500px] items-end gap-1.5 sm:min-w-0">
              {horas.map((h) => (
                <div key={h.hora} className="group relative flex h-full flex-1 flex-col items-center justify-end">
                  <div className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-line bg-ink-950 px-2.5 py-1.5 text-[11px] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    <b>{String(h.hora).padStart(2, '0')}:00</b> · {h.permitidos} ok · {h.denegados} den.
                  </div>
                  <div className="flex w-full flex-col justify-end overflow-hidden rounded-sm" style={{ height: `${(h.total / maxHora) * 100}%` }}>
                    <div className="w-full bg-red-500/70" style={{ height: h.total ? `${(h.denegados / h.total) * 100}%` : 0 }} />
                    <div className="w-full flex-1 bg-brand transition-opacity duration-200 group-hover:opacity-90" />
                  </div>
                  {h.total === 0 && (
                    <div className={`h-1 w-full rounded-full ${h.hora === horaActual ? 'bg-brand/50' : 'bg-ink-700'}`} />
                  )}
                  <span className={`mt-2 text-[10px] tabular-nums ${h.hora === horaActual ? 'font-bold text-brand' : 'text-gray-500'}`}>
                    {String(h.hora).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tótem */}
        <div data-tour="inicio-totem" className="card relative flex min-w-0 flex-col overflow-hidden p-4 sm:p-5">
          <div className="relative flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-300">
              <MonitorSmartphone className="h-4.5 w-4.5 text-gray-300" />
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-bold">Tótem 01</h2>
              <p className="text-xs text-muted">Acceso principal · DNI</p>
            </div>
          </div>
          <div className="relative mt-4 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Motivos de rechazo hoy</p>
            {resumen?.motivos?.length ? (
              resumen.motivos.map((m) => (
                <div key={m.motivo} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-ink-750/60 px-3 py-1.5 text-xs">
                  <span className="truncate text-gray-300">{m.motivo}</span>
                  <span className="shrink-0 font-bold text-red-400">{m.total}</span>
                </div>
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-line px-3 py-2.5 text-center text-xs text-muted">Sin rechazos hoy 🎉</p>
            )}
          </div>
          <div className="relative mt-auto flex flex-wrap sm:flex-nowrap gap-2 pt-4">
            <a href="/terminal" target="_blank" rel="noopener noreferrer" className="btn-primary flex-1 whitespace-nowrap" id="btn-abrir-totem">
              Abrir Tótem <ExternalLink className="h-4 w-4" />
            </a>
            <Link to="/admin/socios" className="btn-ghost shrink-0" title="Ir a Socios">
              <Users className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Últimos ingresos */}
      <section data-tour="inicio-ingresos" className="card mt-5 min-w-0 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <Activity className="h-4 w-4 shrink-0 text-brand" />
            <h2 className="text-base font-bold">Últimos ingresos</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
              <Radio className="h-3 w-3 animate-pulse" /> En vivo
            </span>
          </div>
          <button onClick={load} className="flex items-center gap-2 text-xs text-muted hover:text-white" id="btn-refrescar-accesos">
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            {lastUpdate ? `Actualizado ${formatTime(lastUpdate)}` : 'Cargando…'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
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
