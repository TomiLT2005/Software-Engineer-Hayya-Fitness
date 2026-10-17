import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Image as ImageIcon,
  Pencil,
  Power,
  Layers,
  Loader2,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import ModalPlan from '../components/ModalPlan.jsx';
import api, { getErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext.jsx';
import { formatMoney } from '../utils/format';

function PlanCard({ plan, onEdit, onToggleStatus, isToggling }) {
  const [imgError, setImgError] = useState(false);
  const isActive = plan.estado === 'Activo';

  const benefits = useMemo(() => {
    if (Array.isArray(plan.beneficios)) return plan.beneficios;
    if (typeof plan.beneficios === 'string') {
      try {
        const parsed = JSON.parse(plan.beneficios);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return plan.beneficios.split('\n').filter(Boolean);
      }
    }
    return [];
  }, [plan.beneficios]);

  return (
    <div
      className={`card group flex flex-col justify-between overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-line-strong ${!isActive ? 'opacity-80 border-dashed' : ''
        }`}
    >
      <div>
        {/* Banner / Imagen superior idéntico a Figma */}
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-line bg-ink-750/70">
          {plan.imagen_url && !imgError ? (
            <>
              <img
                src={plan.imagen_url}
                alt={plan.nombre}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${!isActive ? 'grayscale contrast-125' : ''
                  }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-transparent to-transparent" />
            </>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-gray-500">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-line/60 bg-ink-800">
                <ImageIcon className="h-6 w-6 stroke-1 text-gray-400" />
              </div>
            </div>
          )}

          {/* Badge de estado cuando está inactivo */}
          {!isActive && (
            <div className="absolute right-3 top-3 rounded-full border border-red-500/25 bg-red-500/5 px-2.5 py-0.5 text-[11px] font-semibold text-red-300 backdrop-blur-sm">
              Inactivo
            </div>
          )}
        </div>

        {/* Título del Plan */}
        <div className="mt-4 flex items-start justify-between gap-2">
          <h2 className="text-xl font-bold tracking-tight text-white">{plan.nombre}</h2>
        </div>

        {/* Bloque INCLUYE + PRECIO */}
        <div className="mt-4 flex items-start justify-between gap-4">
          {/* Columna Izquierda: INCLUYE */}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">INCLUYE:</p>
            {benefits.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {benefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-medium text-gray-200">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <span className="truncate">{benefit}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs italic text-gray-500">Sin beneficios listados</p>
            )}
          </div>

          {/* Columna Derecha: PRECIO */}
          <div className="shrink-0 text-right">
            <p className="text-xs font-medium text-muted">Precio:</p>
            <p className="mt-1 text-2xl font-black tracking-tight text-white tabular-nums">
              {formatMoney(plan.precio)}
            </p>
          </div>
        </div>

        {/* Descripción corta si existe */}
        {plan.descripcion && (
          <p className="mt-4 border-t border-line/60 pt-3 text-xs leading-relaxed text-muted line-clamp-2">
            {plan.descripcion}
          </p>
        )}
      </div>

      {/* Botones inferiores: Desactivar y Modificar exactamente como en Figma */}
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line/60 pt-4">
        <button
          type="button"
          onClick={() => onToggleStatus(plan)}
          disabled={isToggling}
          className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 ${isActive
            ? 'border-line bg-ink-750 text-gray-300 hover:border-line-strong hover:bg-ink-700 hover:text-white'
            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
            }`}
        >
          {isToggling ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted" />
          ) : isActive ? (
            'Desactivar'
          ) : (
            'Activar'
          )}
        </button>

        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-line bg-ink-750 px-3 py-2.5 text-sm font-medium text-gray-300 transition-all duration-150 hover:border-line-strong hover:bg-ink-700 hover:text-white"
        >
          Modificar
        </button>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card flex flex-col justify-between p-5 animate-pulse">
      <div>
        <div className="h-44 w-full rounded-xl bg-ink-750" />
        <div className="mt-4 h-6 w-32 rounded-lg bg-ink-700" />
        <div className="mt-4 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-ink-700" />
            <div className="h-3 w-28 rounded bg-ink-700" />
            <div className="h-3 w-24 rounded bg-ink-700" />
          </div>
          <div className="space-y-2 text-right">
            <div className="ml-auto h-3 w-12 rounded bg-ink-700" />
            <div className="h-6 w-20 rounded bg-ink-700" />
          </div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-line/60 pt-4">
        <div className="h-10 rounded-xl bg-ink-750" />
        <div className="h-10 rounded-xl bg-ink-750" />
      </div>
    </div>
  );
}

export default function GestionPlanes() {
  const toast = useToast();
  const [planes, setPlanes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('Todos'); // 'Todos' | 'Activo' | 'Inactivo'

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchPlanes = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (filterEstado !== 'Todos') params.estado = filterEstado;

      const res = await api.get('/admin/planes', { params });
      setPlanes(res.data.planes || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, filterEstado]);

  useEffect(() => {
    fetchPlanes();
  }, [fetchPlanes]);

  const handleToggleStatus = async (plan) => {
    setTogglingId(plan.id);
    const nuevoEstado = plan.estado === 'Activo' ? 'Inactivo' : 'Activo';
    try {
      const res = await api.patch(`/admin/planes/${plan.id}/estado`, {
        estado: nuevoEstado,
      });

      // Actualizar estado local inmediatamente
      setPlanes((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, estado: res.data.estado } : p))
      );

      toast(
        nuevoEstado === 'Activo'
          ? `Plan "${plan.nombre}" activado`
          : `Plan "${plan.nombre}" desactivado`
      );
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleCreateNew = () => {
    setEditingPlan(null);
    setModalOpen(true);
  };

  const handleSaved = (savedPlan) => {
    fetchPlanes();
  };

  return (
    <div>
      {/* Encabezado con fidelidad al mockup */}
      <Navbar title="Planes" subtitle="Gestión integral de membresías y aranceles" />

      {/* Barra de herramientas: Búsqueda, Filtro y Botón "+ Nuevo Plan" */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Campo de búsqueda */}
          <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="input pl-10 pr-4 py-2.5 bg-ink-800 border-line text-sm"
            />
          </div>

          {/* Select de Filtro */}
          <div className="relative">
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="input cursor-pointer appearance-none bg-ink-800 border-line py-2.5 pl-9 pr-9 text-sm"
              aria-label="Filtrar por estado"
            >
              <option value="Todos">Filtrar por: Todos</option>
              <option value="Activo">Filtrar por: Activos</option>
              <option value="Inactivo">Filtrar por: Inactivos</option>
            </select>
            <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          </div>

          <button
            onClick={fetchPlanes}
            className="icon-btn h-10 w-10 rounded-xl"
            title="Recargar planes"
            aria-label="Recargar planes"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Botón "+ Nuevo Plan" vibrante en naranja como Figma */}
        <button
          onClick={handleCreateNew}
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold tracking-wide"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Nuevo Plan</span>
        </button>
      </div>

      {/* Estado de error */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/25 bg-red-500/5 p-4 text-xs text-red-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={fetchPlanes} className="btn btn-ghost py-1 text-xs text-red-300">
            Reintentar
          </button>
        </div>
      )}

      {/* Grid de Cards (3 columnas idéntico a Figma) */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : planes.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-gray-400">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-white">No se encontraron planes</h3>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {search || filterEstado !== 'Todos'
              ? 'No hay resultados que coincidan con la búsqueda o filtro actual.'
              : 'Aún no creaste planes en el sistema. Empezá agregando tu primer plan.'}
          </p>
          <div className="mt-5 flex gap-3">
            {(search || filterEstado !== 'Todos') && (
              <button
                onClick={() => {
                  setSearch('');
                  setFilterEstado('Todos');
                }}
                className="btn btn-ghost"
              >
                Limpiar filtros
              </button>
            )}
            <button onClick={handleCreateNew} className="btn-primary">
              <Plus className="h-4 w-4" />
              <span>Crear Nuevo Plan</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in">
          {planes.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              isToggling={togglingId === plan.id}
            />
          ))}
        </div>
      )}

      {/* Modal para Crear / Editar Plan */}
      <ModalPlan
        open={modalOpen}
        plan={editingPlan}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}
