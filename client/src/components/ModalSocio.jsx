import { useEffect, useState } from 'react';
import { UserPlus, UserCog, Loader2, IdCard, Mail, Phone, HeartPulse, Check, AlertCircle } from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext.jsx';
import { onlyDigits } from '../utils/format';

const EMPTY = {
  dni: '',
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  plan: '',
  ficha_medica_entregada: false,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f) {
  const e = {};
  if (!/^\d{6,10}$/.test(f.dni)) e.dni = 'Entre 6 y 10 dígitos';
  if (!f.nombre.trim()) e.nombre = 'Requerido';
  if (!f.apellido.trim()) e.apellido = 'Requerido';
  if (f.correo && !EMAIL_RE.test(f.correo)) e.correo = 'Correo inválido';
  if (f.telefono && !/^[\d\s+()-]{6,20}$/.test(f.telefono)) e.telefono = 'Teléfono inválido';
  if (!f.plan) e.plan = 'Seleccioná un plan';
  return e;
}

function Field({ id, label, error, icon: Icon, tour, children }) {
  return (
    <div data-tour={tour}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

/**
 * Modal de alta / edición de socio.
 * @param {object|null} socio  null = alta, objeto = edición
 */
export default function ModalSocio({ open, socio, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = Boolean(socio);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  // Lista dinámica de planes obtenidos de la base de datos
  const [planesList, setPlanesList] = useState([]);
  const [loadingPlanes, setLoadingPlanes] = useState(false);

  // Carga de planes al abrir el modal
  useEffect(() => {
    if (!open) return;

    setErrors({});
    setServerError('');
    setLoadingPlanes(true);

    api
      .get('/admin/planes')
      .then((res) => {
        const allPlanes = res.data.planes || [];

        // Filtro estricto: para altas sólo planes con estado = 'Activo'
        // Si es edición, se permite también el plan actual del socio aunque esté inactivo
        const disponibles = allPlanes.filter((p) => {
          if (p.estado === 'Activo') return true;
          if (socio && p.nombre === socio.plan) return true;
          return false;
        });

        setPlanesList(disponibles);

        // Determinación del plan inicial
        if (socio) {
          setForm({
            dni: socio.dni || '',
            nombre: socio.nombre || '',
            apellido: socio.apellido || '',
            correo: socio.correo || '',
            telefono: socio.telefono || '',
            plan: socio.plan || (disponibles[0]?.nombre ?? 'Mensual'),
            ficha_medica_entregada: Boolean(socio.ficha_medica_entregada),
          });
        } else {
          setForm({
            ...EMPTY,
            plan: disponibles[0]?.nombre || 'Mensual',
          });
        }
      })
      .catch((err) => {
        console.error('[ModalSocio] Error cargando planes:', err);
        // Fallback básico si falla la red
        const fallback = [
          { nombre: 'Mensual', estado: 'Activo' },
          { nombre: 'Quincenal', estado: 'Activo' },
        ];
        setPlanesList(fallback);
        if (socio) {
          setForm({
            dni: socio.dni || '',
            nombre: socio.nombre || '',
            apellido: socio.apellido || '',
            correo: socio.correo || '',
            telefono: socio.telefono || '',
            plan: socio.plan || 'Mensual',
            ficha_medica_entregada: Boolean(socio.ficha_medica_entregada),
          });
        } else {
          setForm({ ...EMPTY, plan: 'Mensual' });
        }
      })
      .finally(() => setLoadingPlanes(false));
  }, [open, socio]);

  const set = (key) => (e) => {
    const value = key === 'dni' ? onlyDigits(e.target.value).slice(0, 10) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) return;

    setSaving(true);
    setServerError('');
    try {
      const payload = {
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim(),
      };
      const { data } = isEdit
        ? await api.put(`/admin/socios/${socio.id}`, payload)
        : await api.post('/admin/socios', payload);
      toast(isEdit ? 'Socio actualizado correctamente' : `¡${data.socio.nombre} ya es socio de Hayya!`);
      onSaved?.(data.socio);
      onClose();
    } catch (err) {
      if (err.response?.data?.fields) setErrors(err.response.data.fields);
      setServerError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      icon={isEdit ? UserCog : UserPlus}
      tour="modal-socio"
      title={isEdit ? 'Editar Socio' : 'Nuevo Socio'}
      subtitle={isEdit ? `Modificá los datos de ${socio?.nombre} ${socio?.apellido}` : 'Completá los datos para dar de alta un socio'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="form-socio" id="btn-guardar-socio" data-tour="socio-form-guardar" className="btn-primary min-w-[150px]" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEdit ? 'Guardar cambios' : 'Crear socio'}
          </button>
        </>
      }
    >
      <form id="form-socio" onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/5 px-4 py-3 text-xs text-red-300 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{serverError}</span>
          </div>
        )}

        <Field id="socio-dni" label="DNI" error={errors.dni} icon={IdCard} tour="socio-form-dni">
          <input
            id="socio-dni"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ej: 42109832"
            value={form.dni}
            onChange={set('dni')}
            className={`input pl-10 font-mono tracking-wider ${errors.dni ? 'input-error' : ''}`}
            autoFocus
          />
        </Field>

        <div data-tour="socio-form-nombre" className="grid gap-5 sm:grid-cols-2">
          <Field id="socio-nombre" label="Nombre" error={errors.nombre}>
            <input
              id="socio-nombre"
              maxLength={100}
              placeholder="Rodrigo"
              value={form.nombre}
              onChange={set('nombre')}
              className={`input ${errors.nombre ? 'input-error' : ''}`}
            />
          </Field>
          <Field id="socio-apellido" label="Apellido" error={errors.apellido}>
            <input
              id="socio-apellido"
              maxLength={100}
              placeholder="Faro"
              value={form.apellido}
              onChange={set('apellido')}
              className={`input ${errors.apellido ? 'input-error' : ''}`}
            />
          </Field>
        </div>

        <div data-tour="socio-form-contacto" className="grid gap-5 sm:grid-cols-2">
          <Field id="socio-correo" label="Correo" error={errors.correo} icon={Mail}>
            <input
              id="socio-correo"
              type="email"
              maxLength={255}
              placeholder="socio@correo.com"
              value={form.correo}
              onChange={set('correo')}
              className={`input pl-10 ${errors.correo ? 'input-error' : ''}`}
            />
          </Field>
          <Field id="socio-telefono" label="Teléfono" error={errors.telefono} icon={Phone}>
            <input
              id="socio-telefono"
              type="tel"
              maxLength={20}
              placeholder="3537 123456"
              value={form.telefono}
              onChange={set('telefono')}
              className={`input pl-10 ${errors.telefono ? 'input-error' : ''}`}
            />
          </Field>
        </div>

        {/* Selección dinámica de Plan */}
        <div data-tour="socio-form-plan">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="label mb-0">Plan de Membresía</span>
            {loadingPlanes && (
              <span className="flex items-center gap-1.5 text-[11px] text-muted">
                <Loader2 className="h-3 w-3 animate-spin text-brand" />
                Cargando planes…
              </span>
            )}
          </div>

          {planesList.length === 0 && !loadingPlanes ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>No hay planes activos configurados en el sistema. Creá o activá uno en la sección Planes.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3" role="radiogroup">
              {planesList.map((p) => {
                const planName = p.nombre;
                const active = form.plan === planName;
                const isPlanInactive = p.estado === 'Inactivo';
                return (
                  <button
                    type="button"
                    key={planName}
                    id={`plan-${planName.toLowerCase().replace(/\s+/g, '-')}`}
                    role="radio"
                    aria-checked={active}
                    onClick={() => setForm((f) => ({ ...f, plan: planName }))}
                    className={`group relative flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                      active
                        ? 'border-brand/60 bg-brand/5 text-white shadow-sm'
                        : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-sm font-semibold truncate w-full">{planName}</span>
                    {p.precio !== undefined && (
                      <span className="mt-0.5 text-[11px] text-muted tabular-nums">
                        ${Math.round(p.precio).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
                      </span>
                    )}
                    {isPlanInactive && (
                      <span className="mt-1 rounded-full border border-red-500/25 bg-red-500/5 px-2 py-0.5 text-[9px] font-bold text-red-300">
                        Inactivo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {errors.plan && <p className="mt-1.5 text-xs text-red-400">{errors.plan}</p>}
        </div>

        <label
          htmlFor="socio-ficha"
          data-tour="socio-form-ficha"
          className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-colors ${
            form.ficha_medica_entregada ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-line bg-ink-750 hover:border-line-strong'
          }`}
        >
          <input
            id="socio-ficha"
            type="checkbox"
            className="peer sr-only"
            checked={form.ficha_medica_entregada}
            onChange={(e) => setForm((f) => ({ ...f, ficha_medica_entregada: e.target.checked }))}
          />
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
              form.ficha_medica_entregada ? 'bg-emerald-500/15 text-emerald-400' : 'bg-ink-700 text-gray-500'
            }`}
          >
            <HeartPulse className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Ficha Médica Entregada</p>
            <p className="text-xs text-muted">Sin ficha médica el tótem deniega el acceso.</p>
          </div>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand/60 ${
              form.ficha_medica_entregada ? 'bg-emerald-500' : 'bg-ink-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                form.ficha_medica_entregada ? 'left-[22px]' : 'left-0.5'
              }`}
            />
          </span>
        </label>
      </form>
    </Modal>
  );
}
