import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Power,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HeartPulse,
  Loader2,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import ModalSocio from '../components/ModalSocio.jsx';
import ModalFicha from '../components/ModalFicha.jsx';
import { Wordmark } from '../components/Logo.jsx';
import api, { getErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext.jsx';
import { formatDni, PLANES } from '../utils/format';
import { useTourUi } from '../tour/tourBus.js';

const PAGE_SIZE = 8;

function StatCard({ label, value, icon: Icon, tone = 'white', delay = 0 }) {
  const t = {
    white: { text: 'text-white', ring: 'border-white/10 bg-white/[0.03] text-gray-400' },
    green: { text: 'text-emerald-400', ring: 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400' },
    red: { text: 'text-red-400', ring: 'border-red-500/25 bg-red-500/5 text-red-400' },
  }[tone] || { text: 'text-white', ring: 'border-white/10 bg-white/[0.03] text-gray-400' };

  return (
    <div
      className="card relative overflow-hidden px-5 py-3.5 sm:px-6 sm:py-4 transition-all duration-200 hover:border-white/20 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg border ${t.ring}`}>
          <Icon className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className={`mt-2 text-2xl sm:text-[28px] font-bold tabular-nums tracking-tight ${t.text}`}>
        {value === null ? <span className="inline-block h-8 w-14 animate-pulse rounded-lg bg-ink-700" /> : value}
      </p>
    </div>
  );
}

function SelectFilter({ id, label, value, onChange, options }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input cursor-pointer appearance-none py-2.5 pl-4 pr-10"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink-800">
            {label}: {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
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

export default function GestionSocios() {
  const toast = useToast();
  const [stats, setStats] = useState({ total: null, activos: null, inactivos: null });
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [plan, setPlan] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search.trim());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fichaId, setFichaId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/socios/stats');
      setStats(data);
    } catch {
      /* los KPIs no bloquean la pantalla */
    }
  }, []);

  const reqId = useRef(0);
  const loadSocios = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/socios', {
        params: { search: debouncedSearch || undefined, estado: estado || undefined, plan: plan || undefined, page, limit: PAGE_SIZE },
      });
      if (id !== reqId.current) return; // respuesta vieja: se descarta
      setRows(data.data);
      setPagination(data.pagination);
      if (page > data.pagination.totalPages) setPage(data.pagination.totalPages);
    } catch (err) {
      if (id === reqId.current) setError(getErrorMessage(err));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [debouncedSearch, estado, plan, page]);

  const [planesFilter, setPlanesFilter] = useState([]);

  const loadPlanes = useCallback(async () => {
    try {
      const res = await api.get('/admin/planes');
      // Filtramos únicamente planes activos tal como se solicita
      const activos = (res.data.planes || []).filter((p) => p.estado === 'Activo');
      setPlanesFilter(activos.map((p) => p.nombre));
    } catch {
      setPlanesFilter(PLANES);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadPlanes();
  }, [loadStats, loadPlanes]);

  useEffect(() => {
    loadSocios();
  }, [loadSocios]);

  // Volver a la página 1 cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, estado, plan]);

  const refreshAll = () => {
    loadStats();
    loadSocios();
    loadPlanes();
  };

  const toggleEstado = async (socio) => {
    setTogglingId(socio.id);
    try {
      const { data } = await api.patch(`/admin/socios/${socio.id}/estado`);
      setRows((rs) => rs.map((r) => (r.id === socio.id ? data.socio : r)));
      toast(
        `${data.socio.nombre} ${data.socio.apellido} ahora está ${data.socio.estado}`,
        data.socio.estado === 'Activo' ? 'success' : 'warning'
      );
      loadStats();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (socio) => {
    setFichaId(null);
    setEditing(socio);
    setFormOpen(true);
  };

  // El guided tour abre el formulario de alta y la ficha del primer socio para explicarlos
  useTourUi(({ ui }) => {
    if (ui === 'socio-nuevo') {
      if (!formOpen) openNew();
    } else {
      setFormOpen(false);
    }
    if (ui === 'socio-ficha') {
      if (!fichaId && rows[0]) setFichaId(rows[0].id);
    } else {
      setFichaId(null);
    }
  });

  const pages = useMemo(() => {
    const { totalPages } = pagination;
    const current = pagination.page;
    const start = Math.max(1, Math.min(current - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pagination]);

  const hasFilters = Boolean(debouncedSearch || estado || plan);

  return (
    <>
      <Navbar title="Socios" subtitle="Gestión integral de socios, fichas médicas y membresías" />

      {/* KPIs */}
      <section data-tour="socios-kpis" className="grid gap-4 sm:grid-cols-3 lg:max-w-[860px]" aria-label="Indicadores">
        <StatCard label="Total Socios" value={stats.total} icon={Users} />
        <StatCard label="Activos" value={stats.activos} icon={UserCheck} tone="green" delay={60} />
        <StatCard label="Inactivos" value={stats.inactivos} icon={UserX} tone="red" delay={120} />
      </section>

      {/* Barra de herramientas */}
      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            id="buscar-socio"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por DNI o Nombre..."
            className="input pl-10"
            maxLength={100}
          />
        </div>
        <SelectFilter
          id="filtro-plan"
          label="Membresía"
          value={plan}
          onChange={setPlan}
          options={[{ value: '', label: 'Todos' }, ...planesFilter.map((p) => ({ value: p, label: p }))]}
        />
        <SelectFilter
          id="filtro-estado"
          label="Estado"
          value={estado}
          onChange={setEstado}
          options={[
            { value: '', label: 'Todos' },
            { value: 'Activo', label: 'Activo' },
            { value: 'Inactivo', label: 'Inactivo' },
          ]}
        />
        <button data-tour="socios-refresh" onClick={refreshAll} className="icon-btn h-10 w-10 rounded-xl" aria-label="Actualizar" title="Actualizar">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button id="btn-nuevo-socio" onClick={openNew} className="btn-primary ml-auto px-5">
          <Plus className="h-4 w-4" strokeWidth={2.5} /> Nuevo Socio
        </button>
      </section>

      {/* Tabla */}
      <section data-tour="socios-tabla" className="card mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="border-b border-line bg-ink-850/50">
              <tr>
                <th className="th">DNI</th>
                <th className="th">Nombre y Apellido</th>
                <th className="th">Plan</th>
                <th className="th">Ficha Médica</th>
                <th className="th">Estado</th>
                <th className="th text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading && rows.length === 0 &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="td">
                        <div className="h-4 animate-pulse rounded bg-ink-700" style={{ width: `${50 + ((i + j) % 4) * 12}%` }} />
                      </td>
                    ))}
                  </tr>
                ))}

              {rows.map((s, i) => {
                const activo = s.estado === 'Activo';
                return (
                  <tr
                    key={s.id}
                    className={`group transition-colors hover:bg-white/[0.02] ${loading ? 'opacity-60' : ''} animate-fade-in`}
                    style={{ animationDelay: `${i * 25}ms` }}
                  >
                    <td className="td font-mono text-[13px] text-gray-300">{formatDni(s.dni)}</td>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-[11px] font-bold text-gray-300">
                          {s.nombre[0]}
                          {s.apellido[0]}
                        </div>
                        <span className="font-semibold">
                          {s.nombre} <span className="font-normal text-gray-300">{s.apellido}</span>
                        </span>
                      </div>
                    </td>
                    <td className="td text-gray-300">{s.plan}</td>
                    <td className="td">
                      {s.ficha_medica_entregada ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                          <HeartPulse className="h-3.5 w-3.5" /> Entregada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400">
                          <HeartPulse className="h-3.5 w-3.5" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="td">
                      <span className={activo ? 'badge-success' : 'badge-danger'}>
                        <span className="badge-dot" />
                        {activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="td">
                      <div className="flex justify-end gap-2">
                        <button data-tour={i === 0 ? 'socio-ver' : undefined} onClick={() => setFichaId(s.id)} className="icon-btn" title="Ver ficha" aria-label={`Ver ficha de ${s.nombre}`}>
                          <Eye className="h-4 w-4" />
                        </button>
                        <button data-tour={i === 0 ? 'socio-editar' : undefined} onClick={() => openEdit(s)} className="icon-btn" title="Editar" aria-label={`Editar a ${s.nombre}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          data-tour={i === 0 ? 'socio-toggle' : undefined}
                          onClick={() => toggleEstado(s)}
                          disabled={togglingId === s.id}
                          className={`icon-btn ${activo ? 'hover:border-red-500/50 hover:text-red-400' : 'hover:border-emerald-500/50 hover:text-emerald-400'}`}
                          title={activo ? 'Desactivar' : 'Activar'}
                          aria-label={`${activo ? 'Desactivar' : 'Activar'} a ${s.nombre}`}
                        >
                          {togglingId === s.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <p className="text-sm text-red-300">{error}</p>
            <button onClick={loadSocios} className="btn-ghost">
              <RefreshCw className="h-4 w-4" /> Reintentar
            </button>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <Wordmark size="sm" emblemClass="text-white/80" className="opacity-60" />
            <p className="mt-6 text-sm text-muted">
              {hasFilters ? 'No hay socios que coincidan con la búsqueda.' : 'Todavía no hay socios cargados.'}
            </p>
            {!hasFilters && (
              <button onClick={openNew} className="btn-primary mt-4">
                <Plus className="h-4 w-4" /> Cargar el primero
              </button>
            )}
          </div>
        )}
      </section>

      {/* Paginación */}
      {pagination.total > 0 && (
        <nav data-tour="socios-paginacion" className="mt-5 flex flex-wrap items-center justify-between gap-3" aria-label="Paginación">
          <p className="text-xs text-muted">
            Mostrando {(pagination.page - 1) * PAGE_SIZE + 1}–{Math.min(pagination.page * PAGE_SIZE, pagination.total)} de{' '}
            {pagination.total} socios
          </p>
          <div className="flex items-center gap-2">
            <button
              id="pag-anterior"
              className="btn-ghost px-3 py-1.5 text-xs"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Anterior
            </button>
            {pages.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-bold transition-all ${
                  n === pagination.page ? 'bg-brand text-white' : 'border border-line bg-ink-750 text-gray-400 hover:text-white'
                }`}
                aria-current={n === pagination.page ? 'page' : undefined}
              >
                {n}
              </button>
            ))}
            <button
              id="pag-siguiente"
              className="btn-ghost px-3 py-1.5 text-xs"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            >
              Siguiente <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </nav>
      )}

      <ModalSocio open={formOpen} socio={editing} onClose={() => setFormOpen(false)} onSaved={refreshAll} />
      <ModalFicha socioId={fichaId} onClose={() => setFichaId(null)} onEdit={openEdit} onChanged={refreshAll} />
    </>
  );
}
