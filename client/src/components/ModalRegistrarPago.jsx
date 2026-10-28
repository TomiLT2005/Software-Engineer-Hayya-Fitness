import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CreditCard,
  Search,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText,
  Loader2,
  X,
} from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext.jsx';
import { formatDni, formatMoney, formatDate } from '../utils/format';

const METODOS = ['Efectivo', 'Transferencia'];

export default function ModalRegistrarPago({ open, onClose, onSaved, initialSocio = null }) {
  const toast = useToast();

  const [socios, setSocios] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(false);

  // Form state
  const [socioQuery, setSocioQuery] = useState('');
  const [selectedSocio, setSelectedSocio] = useState(null);
  const [plan, setPlan] = useState('Mensual');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [comprobanteRef, setComprobanteRef] = useState('');

  // Cotización calculada desde backend o estimada
  const [cotizacion, setCotizacion] = useState(null);
  const [loadingCotizacion, setLoadingCotizacion] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  // Cargar lista de socios y planes disponibles
  const loadData = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const [resSocios, resPlanes] = await Promise.all([
        api.get('/admin/socios', { params: { limit: 100 } }),
        api.get('/admin/planes'),
      ]);
      setSocios(resSocios.data.data || []);
      const activos = (resPlanes.data.planes || []).filter((p) => p.estado === 'Activo');
      setPlanes(activos);
      if (activos.length > 0 && !activos.some((p) => p.nombre === 'Mensual')) {
        setPlan(activos[0].nombre);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      loadData();
      if (initialSocio) {
        setSelectedSocio(initialSocio);
        setSocioQuery(`${initialSocio.nombre} ${initialSocio.apellido} (${initialSocio.dni})`);
        if (initialSocio.plan) setPlan(initialSocio.plan);
      } else {
        setSelectedSocio(null);
        setSocioQuery('');
      }
      setMetodoPago('Efectivo');
      setComprobanteRef('');
      setError('');
      setErrors({});
      setCotizacion(null);
    }
  }, [open, initialSocio, loadData]);

  // Filtrado de socios por DNI o Nombre en el input
  const filteredSocios = useMemo(() => {
    const q = socioQuery.trim().toLowerCase();
    if (!q || (selectedSocio && socioQuery.includes(selectedSocio.dni))) return [];
    return socios.filter(
      (s) =>
        s.dni.includes(q) ||
        s.nombre.toLowerCase().includes(q) ||
        s.apellido.toLowerCase().includes(q) ||
        `${s.nombre} ${s.apellido}`.toLowerCase().includes(q)
    );
  }, [socios, socioQuery, selectedSocio]);

  // Actualizar cotización cuando cambian socio o plan
  useEffect(() => {
    if (!selectedSocio || !plan) {
      setCotizacion(null);
      return;
    }

    let active = true;
    setLoadingCotizacion(true);

    api
      .get('/admin/pagos/cotizacion', { params: { socioId: selectedSocio.id, plan } })
      .then((res) => {
        if (active) setCotizacion(res.data.cotizacion);
      })
      .catch((err) => {
        if (active) {
          // Fallback en caso de que el endpoint falle: cálculo local
          const pObj = planes.find((p) => p.nombre === plan);
          const base = Number(pObj?.precio || (plan === 'Mensual' ? 25000 : plan === 'Quincenal' ? 15000 : 3000));
          const hoy = new Date();
          const diaMes = hoy.getDate();
          const aplicaMora = diaMes > 10;
          const recargo = aplicaMora ? Math.round(base * 0.1) : 0;
          setCotizacion({
            plan,
            monto_base: base,
            recargo_mora: recargo,
            monto_total: base + recargo,
            aplica_mora: aplicaMora,
            porcentaje_mora: 10,
            estaba_vencido: selectedSocio.fecha_vencimiento ? new Date(selectedSocio.fecha_vencimiento) < hoy : true,
            dia_mes: diaMes,
          });
        }
      })
      .finally(() => {
        if (active) setLoadingCotizacion(false);
      });

    return () => {
      active = false;
    };
  }, [selectedSocio, plan, planes]);

  const handleSelectSocio = (s) => {
    setSelectedSocio(s);
    setSocioQuery(`${s.nombre} ${s.apellido} (${formatDni(s.dni)})`);
    if (s.plan) setPlan(s.plan);
    setErrors((prev) => ({ ...prev, socio: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const newErrors = {};

    if (!selectedSocio) newErrors.socio = 'Seleccioná un socio de la lista';
    if (!plan) newErrors.plan = 'Seleccioná un plan a abonar';
    if (metodoPago === 'Transferencia' && !comprobanteRef.trim()) {
      newErrors.comprobante = 'El número de comprobante es obligatorio para transferencias';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('/admin/pagos', {
        socio_id: selectedSocio.id,
        plan,
        metodo_pago: metodoPago,
        comprobante_ref: comprobanteRef.trim() || undefined,
      });

      toast(`Pago de ${selectedSocio.nombre} ${selectedSocio.apellido} registrado con éxito`, 'success');
      onSaved?.(res.data);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const hoy = new Date();
  const diaMes = hoy.getDate();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Registrar Pago"
      subtitle="Cobro de cuota y renovación de membresía"
      icon={CreditCard}
      tour="modal-pago"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="submit"
            form="form-registrar-pago"
            data-tour="pago-confirmar"
            disabled={saving || !selectedSocio || loadingCotizacion}
            className="btn-primary min-w-[140px]"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Registrando...
              </>
            ) : (
              'Confirmar Pago'
            )}
          </button>
        </>
      }
    >
      <form id="form-registrar-pago" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2.5 rounded-lg border border-red-500/25 bg-red-500/5 p-3 text-xs text-red-300 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Buscador de socio */}
        <div data-tour="pago-socio" className="relative">
          <label className="label">Socio *</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por DNI o Nombre del socio..."
              value={socioQuery}
              onChange={(e) => {
                setSocioQuery(e.target.value);
                if (selectedSocio) setSelectedSocio(null);
              }}
              className={`input pl-10 pr-9 ${errors.socio ? 'border-red-500/50' : ''}`}
            />
            {selectedSocio && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSocio(null);
                  setSocioQuery('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {errors.socio && <p className="mt-1 text-xs text-red-400">{errors.socio}</p>}

          {/* Resultados de búsqueda flotante */}
          {filteredSocios.length > 0 && (
            <div className="absolute left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-white/10 bg-[#1c1c1c] p-1.5 shadow-2xl backdrop-blur-md">
              {filteredSocios.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => handleSelectSocio(s)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-white/[0.05]"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {s.nombre} {s.apellido}
                    </p>
                    <p className="text-[11px] text-muted">DNI {formatDni(s.dni)} · Plan: {s.plan}</p>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      s.fecha_vencimiento && new Date(s.fecha_vencimiento) >= new Date()
                        ? 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400'
                        : 'border-red-500/25 bg-red-500/5 text-red-400'
                    }`}
                  >
                    {s.fecha_vencimiento ? formatDate(s.fecha_vencimiento) : 'Sin pagos'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ficha rápida del socio seleccionado */}
        {selectedSocio && (
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-semibold text-gray-200">
                {selectedSocio.nombre[0]}
                {selectedSocio.apellido[0]}
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-white">
                  {selectedSocio.nombre} {selectedSocio.apellido}
                </p>
                <p className="text-[11px] text-muted">DNI: {formatDni(selectedSocio.dni)}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted block">Vencimiento</span>
              <span
                className={`text-xs font-semibold ${
                  cotizacion?.estaba_vencido ? 'text-red-400' : 'text-emerald-400'
                }`}
              >
                {selectedSocio.fecha_vencimiento ? formatDate(selectedSocio.fecha_vencimiento) : 'Vencido / Sin registro'}
              </span>
            </div>
          </div>
        )}

        {/* Plan a abonar */}
        <div data-tour="pago-plan">
          <label className="label">Plan a Abonar *</label>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            className="input cursor-pointer"
          >
            {planes.length > 0 ? (
              planes.map((p) => (
                <option key={p.id} value={p.nombre} className="bg-ink-800">
                  {p.nombre} — {formatMoney(p.precio)}
                </option>
              ))
            ) : (
              <>
                <option value="Mensual">Mensual — $25.000</option>
                <option value="Quincenal">Quincenal — $15.000</option>
                <option value="1 Día">1 Día — $3.000</option>
              </>
            )}
          </select>
        </div>

        {/* Regla de negocio: Desglose de Cobro con Recargo de Mora */}
        <div data-tour="pago-desglose" className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted border-b border-white/5 pb-2.5">
            <span className="flex items-center gap-1.5 font-medium text-gray-300">
              <Calendar className="h-3.5 w-3.5 text-gray-400" /> Día del mes de pago:
            </span>
            <span className="font-semibold text-white">
              Día {diaMes} ({formatDate(hoy)})
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Monto Base del Plan:</span>
            <span className="font-semibold text-white tabular-nums">
              {cotizacion ? formatMoney(cotizacion.monto_base) : '—'}
            </span>
          </div>

          {/* Alerta / Detalle de Mora */}
          {cotizacion?.aplica_mora ? (
            <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-2.5 space-y-1 animate-fade-in">
              <div className="flex items-center justify-between text-xs text-amber-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Recargo por Mora (+10%):
                </span>
                <span className="tabular-nums font-bold">+{formatMoney(cotizacion.recargo_mora)}</span>
              </div>
              <p className="text-[11px] text-amber-300/70 leading-tight">
                Pago realizado después del día 10 del mes actual (+10% de recargo por mora).
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-2 text-xs text-emerald-400 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Recargo por Mora:
              </span>
              <span className="font-semibold">$0 (Abonado hasta el día 10)</span>
            </div>
          )}

          <div className="border-t border-white/5 pt-2.5 flex items-center justify-between">
            <span className="text-sm font-semibold text-white">Monto Total a Cobrar:</span>
            <span className="text-xl font-extrabold text-brand tabular-nums">
              {cotizacion ? formatMoney(cotizacion.monto_total) : '—'}
            </span>
          </div>
        </div>

        {/* Método de pago */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div data-tour="pago-metodo">
            <label className="label">Método de Pago *</label>
            <select
              value={metodoPago}
              onChange={(e) => {
                setMetodoPago(e.target.value);
                setErrors((prev) => ({ ...prev, comprobante: undefined }));
              }}
              className="input cursor-pointer"
            >
              {METODOS.map((m) => (
                <option key={m} value={m} className="bg-ink-800">
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div data-tour="pago-comprobante">
            <label className="label">
              N° Comprobante {metodoPago === 'Transferencia' ? '*' : '(Opcional)'}
            </label>
            <div className="relative">
              <FileText className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                value={comprobanteRef}
                onChange={(e) => setComprobanteRef(e.target.value)}
                placeholder={metodoPago === 'Transferencia' ? 'Ej: TRANSF-98234' : 'Opcional'}
                className={`input pl-10 ${errors.comprobante ? 'border-red-500' : ''}`}
                maxLength={100}
              />
            </div>
            {errors.comprobante && <p className="mt-1 text-xs text-red-400">{errors.comprobante}</p>}
          </div>
        </div>
      </form>
    </Modal>
  );
}
