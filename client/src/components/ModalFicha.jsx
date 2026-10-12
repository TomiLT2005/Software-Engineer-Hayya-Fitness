import { useEffect, useState } from 'react';
import {
  IdCard,
  Mail,
  Phone,
  Calendar,
  HeartPulse,
  Trophy,
  Pencil,
  Power,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  UserRound,
} from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext.jsx';
import { formatDni, formatDate, formatDateTime } from '../utils/format';

function Info({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-ink-750/60 px-4 py-3">
      <Icon className="h-4 w-4 shrink-0 text-gray-500" />
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className={`truncate text-sm ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

/** Modal "Ver Ficha": detalle completo del socio, puntos e historial de accesos. */
export default function ModalFicha({ socioId, onClose, onEdit, onChanged }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!socioId) return undefined;
    let alive = true;
    setData(null);
    setError('');
    setConfirmDelete(false);
    api
      .get(`/admin/socios/${socioId}`)
      .then((r) => alive && setData(r.data))
      .catch((err) => alive && setError(getErrorMessage(err)));
    return () => {
      alive = false;
    };
  }, [socioId]);

  const socio = data?.socio;
  const activo = socio?.estado === 'Activo';
  const puntos = socio?.puntos ?? 0;
  const nivel = puntos >= 500 ? 'Oro' : puntos >= 150 ? 'Plata' : 'Bronce';
  const next = puntos >= 500 ? 500 : puntos >= 150 ? 500 : 150;
  const pct = Math.min(100, Math.round((puntos / next) * 100));

  const toggleEstado = async () => {
    setBusy('estado');
    try {
      const { data: r } = await api.patch(`/admin/socios/${socio.id}/estado`);
      setData((d) => ({ ...d, socio: r.socio }));
      toast(`Socio ${r.socio.estado === 'Activo' ? 'activado' : 'desactivado'}`, r.socio.estado === 'Activo' ? 'success' : 'warning');
      onChanged?.();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await api.delete(`/admin/socios/${socio.id}`);
      toast('Socio eliminado', 'warning');
      onChanged?.();
      onClose();
    } catch (err) {
      toast(getErrorMessage(err), 'error');
      setBusy('');
    }
  };

  return (
    <Modal
      open={Boolean(socioId)}
      onClose={onClose}
      icon={UserRound}
      title="Ficha del Socio"
      subtitle="Detalle completo, puntos e historial de ingresos"
      size="xl"
      footer={
        socio && (
          <>
            {confirmDelete ? (
              <div className="mr-auto flex items-center gap-2">
                <span className="text-sm text-red-300">¿Eliminar definitivamente?</span>
                <button className="btn-danger py-2" onClick={remove} disabled={busy === 'delete'} id="btn-confirmar-eliminar">
                  {busy === 'delete' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sí, eliminar'}
                </button>
                <button className="btn-ghost py-2" onClick={() => setConfirmDelete(false)}>
                  No
                </button>
              </div>
            ) : (
              <button className="btn-danger mr-auto" onClick={() => setConfirmDelete(true)} id="btn-eliminar-socio">
                <Trash2 className="h-4 w-4" /> Eliminar
              </button>
            )}
            <button className="btn-ghost" onClick={toggleEstado} disabled={busy === 'estado'} id="btn-ficha-estado">
              {busy === 'estado' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
              {activo ? 'Desactivar' : 'Activar'}
            </button>
            <button className="btn-primary" onClick={() => onEdit(socio)} id="btn-ficha-editar">
              <Pencil className="h-4 w-4" /> Editar
            </button>
          </>
        )
      }
    >
      {error && <p className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</p>}

      {!socio && !error && (
        <div className="flex h-60 items-center justify-center">
          <Loader2 className="h-7 w-7 animate-spin text-brand" />
        </div>
      )}

      {socio && (
        <div className="space-y-6 animate-fade-in">
          {/* Encabezado */}
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-brand bg-gradient-to-br from-brand/20 to-transparent text-xl font-extrabold">
              {socio.nombre[0]}
              {socio.apellido[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">
                {socio.nombre} {socio.apellido}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={activo ? 'badge-success' : 'badge-danger'}>
                  <span className="badge-dot" />
                  {activo ? 'Activo' : 'Inactivo'}
                </span>
                <span className="badge border-line bg-ink-750 text-gray-300">Plan {socio.plan}</span>
                <span className={socio.ficha_medica_entregada ? 'badge-success' : 'badge-warning'}>
                  <HeartPulse className="h-3 w-3" />
                  {socio.ficha_medica_entregada ? 'Ficha entregada' : 'Ficha pendiente'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            {/* Datos */}
            <div className="grid gap-3 sm:grid-cols-2 md:col-span-3">
              <Info icon={IdCard} label="DNI" value={formatDni(socio.dni)} mono />
              <Info icon={Calendar} label="Alta" value={formatDate(socio.created_at)} />
              <Info icon={Mail} label="Correo" value={socio.correo} />
              <Info icon={Phone} label="Teléfono" value={socio.telefono} />
            </div>

            {/* Puntos */}
            <div className="relative overflow-hidden rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/15 via-ink-800 to-ink-800 p-5 md:col-span-2">
              <Trophy className="absolute -right-3 -top-3 h-24 w-24 text-brand/10" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-300">Puntos Hayya</p>
              <p className="mt-1 text-4xl font-extrabold">{puntos}</p>
              <p className="mt-1 text-xs text-muted">
                Nivel <span className="font-semibold text-white">{nivel}</span> · {data.resumen?.visitas ?? 0} ingresos
              </p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-700">
                <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-300 transition-all duration-700" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                {puntos >= 500 ? 'Nivel máximo alcanzado' : `${next - puntos} pts para el siguiente nivel`}
              </p>
            </div>
          </div>

          {/* Historial */}
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-300">Últimos ingresos</h4>
            {data.accesos.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">
                Todavía no registra ingresos en el tótem.
              </p>
            ) : (
              <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
                {data.accesos.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 bg-ink-750/40 px-4 py-3 text-sm">
                    {a.estado_acceso === 'PERMITIDO' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                    <span className="flex-1">{a.motivo}</span>
                    <span className="font-mono text-xs text-muted">{formatDateTime(a.fecha_hora)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
