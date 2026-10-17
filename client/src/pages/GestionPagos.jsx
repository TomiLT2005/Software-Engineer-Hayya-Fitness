import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import ModalRegistrarPago from '../components/ModalRegistrarPago.jsx';
import ModalHistorialPagos from '../components/ModalHistorialPagos.jsx';
import api, { getErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext.jsx';
import { formatDni, formatDate } from '../utils/format';

const PAGE_SIZE = 8;

/** Tarjeta superior de métrica (KPI) idéntica a pagos-admin.PNG */
function KpiCard({ label, value, icon: Icon, tone = 'white', delay = 0 }) {
  const textColors = {
    white: 'text-white',
    green: 'text-emerald-400',
    red: 'text-red-400',
  };

  const iconStyles = {
    white: 'border-white/10 bg-white/[0.03] text-gray-400',
    green: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400',
    red: 'border-red-500/25 bg-red-500/5 text-red-400',
  };

  return (
    <div
      className="card relative flex min-w-0 flex-1 flex-col justify-between overflow-hidden p-5 transition-all duration-200"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-muted">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg border ${iconStyles[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className={`mt-3 text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight ${textColors[tone]}`}>
        {value === null ? (
          <span className="inline-block h-9 w-16 animate-pulse rounded-lg bg-ink-700" />
        ) : (
          value
        )}
      </p>
    </div>
  );
}

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function GestionPagos() {
  const toast = useToast();

  const [kpis, setKpis] = useState({ total: null, alDia: null, vencidos: null });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const [search, setSearch] = useState('');
  const [filtroSeleccionado, setFiltroSeleccionado] = useState('todos'); // 'todos' | 'al_dia' | 'vencido' | 'plan:Mensual'...
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search.trim());

  // Planes disponibles para el dropdown
  const [planesList, setPlanesList] = useState([]);

  // Modales
  const [modalPagoOpen, setModalPagoOpen] = useState(false);
  const [socioParaPago, setSocioParaPago] = useState(null);
  const [historialSocioId, setHistorialSocioId] = useState(null);

  // Carga de KPIs
  const loadKpis = useCallback(async () => {
    try {
      const res = await api.get('/admin/pagos/kpis');
      setKpis(res.data);
    } catch {
      // no bloquea la UI
    }
  }, []);

  // Carga de planes para el selector de filtro
  const loadPlanes = useCallback(async () => {
    try {
      const res = await api.get('/admin/planes');
      const activos = (res.data.planes || []).filter((p) => p.estado === 'Activo');
      setPlanesList(activos.map((p) => p.nombre));
    } catch {
      setPlanesList(['Mensual', 'Quincenal', '1 Día']);
    }
  }, []);

  // Carga de tabla de estado de cuentas
  const reqId = useRef(0);
  const loadPagos = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');

    let estadoParam = undefined;
    let planParam = undefined;

    if (filtroSeleccionado === 'al_dia') estadoParam = 'al_dia';
    else if (filtroSeleccionado === 'vencido') estadoParam = 'vencido';
    else if (filtroSeleccionado.startsWith('plan:')) planParam = filtroSeleccionado.replace('plan:', '');

    try {
      const res = await api.get('/admin/pagos', {
        params: {
          search: debouncedSearch || undefined,
          estado: estadoParam,
          plan: planParam,
          page,
          limit: PAGE_SIZE,
        },
      });

      if (id !== reqId.current) return;
      setRows(res.data.data);
      setPagination(res.data.pagination);
      if (page > res.data.pagination.totalPages) {
        setPage(Math.max(1, res.data.pagination.totalPages));
      }
    } catch (err) {
      if (id === reqId.current) setError(getErrorMessage(err));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [debouncedSearch, filtroSeleccionado, page]);

  useEffect(() => {
    loadKpis();
    loadPlanes();
  }, [loadKpis, loadPlanes]);

  useEffect(() => {
    loadPagos();
  }, [loadPagos]);

  // Reset a página 1 al filtrar
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filtroSeleccionado]);

  const refreshAll = () => {
    loadKpis();
    loadPagos();
  };

  const handleOpenNuevoPago = (socio = null) => {
    setSocioParaPago(socio);
    setModalPagoOpen(true);
  };

  const handleOpenHistorial = (socioId) => {
    setHistorialSocioId(socioId);
  };

  // Botones de páginas
  const pages = useMemo(() => {
    const { totalPages } = pagination;
    const current = pagination.page;
    const start = Math.max(1, Math.min(current - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pagination]);

  return (
    <>
      <Navbar title="Pagos" subtitle="Control financiero de abonos y membresías" />

      {/* Tarjetas de Métricas Superiores (KPIs dinámicos SQL COUNT) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-label="Métricas de Pagos">
        <KpiCard
          label="Total Socios"
          value={kpis.total}
          icon={Users}
          tone="white"
          delay={0}
        />
        <KpiCard
          label="Al Día"
          value={kpis.alDia}
          icon={CheckCircle2}
          tone="green"
          delay={60}
        />
        <KpiCard
          label="Vencidos"
          value={kpis.vencidos}
          icon={AlertTriangle}
          tone="red"
          delay={120}
        />
      </section>

      {/* Barra de Búsqueda, Filtro y Acción */}
      <section className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Buscador en tiempo real */}
          <div className="relative w-full sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              id="buscar-pagos"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por DNI o Nombre..."
              className="input pl-10"
              maxLength={100}
            />
          </div>

          {/* Selector de filtro */}
          <div className="relative">
            <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select
              id="filtro-estado-pagos"
              value={filtroSeleccionado}
              onChange={(e) => setFiltroSeleccionado(e.target.value)}
              className="input cursor-pointer appearance-none py-2.5 pl-10 pr-9 text-xs font-medium"
              aria-label="Filtrar por"
            >
              <option value="todos" className="bg-ink-800">
                Filtrar por: Todos
              </option>
              <optgroup label="Por Estado de Cobro" className="bg-ink-800 font-semibold text-muted">
                <option value="al_dia" className="bg-ink-800 font-normal text-white">
                  Pagado / Al Día
                </option>
                <option value="vencido" className="bg-ink-800 font-normal text-white">
                  Vencido
                </option>
              </optgroup>
              {planesList.length > 0 && (
                <optgroup label="Por Plan" className="bg-ink-800 font-semibold text-muted">
                  {planesList.map((p) => (
                    <option key={p} value={`plan:${p}`} className="bg-ink-800 font-normal text-white">
                      Plan: {p}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>

          <button
            onClick={refreshAll}
            className="icon-btn h-10 w-10 rounded-xl"
            aria-label="Actualizar datos"
            title="Actualizar datos"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Botón Primario Naranja */}
        <button
          id="btn-registrar-pago"
          onClick={() => handleOpenNuevoPago()}
          className="btn-primary px-5 shadow-sm"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Registrar Pago
        </button>
      </section>

      {/* Tabla Principal de Estado de Cuentas */}
      <section className="card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b border-line bg-ink-850/60 text-[11px] font-bold uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3.5">DNI</th>
                <th className="px-5 py-3.5">Nombre</th>
                <th className="px-5 py-3.5">Apellido</th>
                <th className="px-5 py-3.5">Plan</th>
                <th className="px-5 py-3.5">Vencimiento</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm">
              {loading && rows.length === 0 &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div
                          className="h-4 animate-pulse rounded bg-ink-700"
                          style={{ width: `${45 + ((i + j) % 4) * 15}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

              {rows.map((socio, i) => {
                const pagado = socio.estado_pago === 'Pagado';
                return (
                  <tr
                    key={socio.id}
                    className="group transition-colors hover:bg-white/[0.02] animate-fade-in"
                    style={{ animationDelay: `${i * 20}ms` }}
                  >
                    <td className="px-5 py-4 font-mono text-[13px] text-gray-300">
                      {formatDni(socio.dni)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-white">{socio.nombre}</td>
                    <td className="px-5 py-4 text-gray-300">{socio.apellido}</td>
                    <td className="px-5 py-4 text-gray-300">{socio.plan}</td>
                    <td className="px-5 py-4 font-mono text-[13px] text-gray-300">
                      {socio.fecha_vencimiento ? formatDate(socio.fecha_vencimiento) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      {pagado ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          Pagado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/5 px-2.5 py-0.5 text-xs font-medium text-red-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                          Vencido
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleOpenHistorial(socio.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-gray-400 transition-colors hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                        title={`Ver historial de pagos de ${socio.nombre}`}
                        aria-label={`Ver historial de pagos de ${socio.nombre}`}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Estado vacío o error */}
        {!loading && error && (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <div className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/5 px-4 py-2 text-xs text-red-300">
              <span>{error}</span>
            </div>
            <button onClick={loadPagos} className="btn-ghost">
              <RefreshCw className="h-4 w-4" /> Reintentar
            </button>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <p className="text-sm text-muted">
              {search || filtroSeleccionado !== 'todos'
                ? 'No se encontraron socios con los filtros aplicados.'
                : 'No hay socios registrados en el sistema.'}
            </p>
          </div>
        )}

        {/* Paginación centrada como en pagos-admin.PNG */}
        {pagination.total > 0 && (
          <div className="flex items-center justify-center gap-2 border-t border-line bg-ink-850/40 px-6 py-4">
            <button
              id="pag-anterior-pagos"
              className="btn-ghost px-3 py-1.5 text-xs text-muted hover:text-white disabled:opacity-40"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </button>

            {pages.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                  n === pagination.page
                    ? 'bg-brand text-white shadow-sm'
                    : 'border border-line bg-ink-750 text-gray-400 hover:text-white'
                }`}
              >
                {n}
              </button>
            ))}

            <button
              id="pag-siguiente-pagos"
              className="btn-ghost px-3 py-1.5 text-xs text-muted hover:text-white disabled:opacity-40"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Siguiente <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </section>

      {/* Modales */}
      <ModalRegistrarPago
        open={modalPagoOpen}
        onClose={() => setModalPagoOpen(false)}
        initialSocio={socioParaPago}
        onSaved={() => refreshAll()}
      />

      <ModalHistorialPagos
        open={Boolean(historialSocioId)}
        onClose={() => setHistorialSocioId(null)}
        socioId={historialSocioId}
        onRegistrarNuevo={(socio) => handleOpenNuevoPago(socio)}
      />
    </>
  );
}
