import { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Loader2,
  Receipt,
} from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getErrorMessage } from '../api/axios';
import { formatDni, formatMoney, formatDateTime, formatDate } from '../utils/format';

export default function ModalHistorialPagos({ open, onClose, socioId, onRegistrarNuevo }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && socioId) {
      setLoading(true);
      setError('');
      setData(null);

      api
        .get(`/admin/pagos/historial/${socioId}`)
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          setError(getErrorMessage(err));
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, socioId]);

  const socio = data?.socio;
  const pagos = data?.pagos || [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Historial de Pagos"
      subtitle={
        socio
          ? `${socio.nombre} ${socio.apellido} · DNI: ${formatDni(socio.dni)}`
          : 'Comprobantes y recibos registrados'
      }
      icon={Receipt}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <p className="text-xs text-muted">
            Total de comprobantes registrados: <b className="text-white">{pagos.length}</b>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cerrar
            </button>
            {socio && onRegistrarNuevo && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRegistrarNuevo(socio);
                }}
                className="btn-primary"
              >
                + Registrar Nuevo Cobro
              </button>
            )}
          </div>
        </div>
      }
    >
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted">
          <Loader2 className="h-6 w-6 animate-spin text-brand" />
          <p className="mt-3 text-xs">Cargando recibos contables...</p>
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2.5 rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-xs text-red-300">
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && socio && (
        <div className="space-y-4">
          {/* Header con resumen del socio */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] p-3.5 text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted block">Membresía actual</span>
              <span className="font-semibold text-white">{socio.plan}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted block">Vencimiento</span>
              <span className="font-semibold text-white">
                {socio.fecha_vencimiento ? formatDate(socio.fecha_vencimiento) : 'Sin fecha'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted block">Estado</span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  socio.estado_pago === 'Pagado' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                ● {socio.estado_pago}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-muted block">Total abonado</span>
              <span className="font-bold text-brand tabular-nums">
                {formatMoney(pagos.reduce((acc, p) => acc + Number(p.monto_total || 0), 0))}
              </span>
            </div>
          </div>

          {/* Tabla cronológica de pagos */}
          {pagos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-muted/60" />
              <p className="mt-2 text-sm font-semibold text-gray-300">Sin pagos registrados</p>
              <p className="mt-0.5 text-xs text-muted">Este socio aún no tiene recibos de cobro en el sistema.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line">
              <table className="w-full min-w-[620px] text-left text-xs">
                <thead className="border-b border-line bg-ink-850/70 text-[10px] font-bold uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-3.5 py-3">Fecha de Pago</th>
                    <th className="px-3.5 py-3">Plan</th>
                    <th className="px-3.5 py-3">Monto Base</th>
                    <th className="px-3.5 py-3">Mora</th>
                    <th className="px-3.5 py-3">Total Cobrado</th>
                    <th className="px-3.5 py-3">Método</th>
                    <th className="px-3.5 py-3">Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pagos.map((p) => {
                    const tieneMora = Number(p.recargo_mora) > 0;
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-white/[0.02]">
                        <td className="px-3.5 py-3 font-mono text-gray-300">
                          {formatDateTime(p.fecha_pago)}
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-white">{p.plan_abonado}</td>
                        <td className="px-3.5 py-3 tabular-nums text-gray-300">
                          {formatMoney(p.monto_base)}
                        </td>
                        <td className="px-3.5 py-3 tabular-nums">
                          {tieneMora ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/5 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                              +{formatMoney(p.recargo_mora)}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-3.5 py-3 font-bold text-white tabular-nums">
                          {formatMoney(p.monto_total)}
                        </td>
                        <td className="px-3.5 py-3">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              p.metodo_pago === 'Transferencia'
                                ? 'border-sky-500/25 bg-sky-500/5 text-sky-400'
                                : 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400'
                            }`}
                          >
                            {p.metodo_pago}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-mono text-[11px] text-muted">
                          {p.comprobante_ref || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
