import { useEffect, useState } from 'react';
import { UserPlus, UserCog, Loader2, IdCard, Mail, Phone, HeartPulse, Check } from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext.jsx';
import { PLANES, onlyDigits } from '../utils/format';

const EMPTY = {
  dni: '',
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  plan: 'Mensual',
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
  if (!PLANES.includes(f.plan)) e.plan = 'Seleccioná un plan';
  return e;
}

function Field({ id, label, error, icon: Icon, children }) {
  return (
    <div>
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

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError('');
    setForm(
      socio
        ? {
            dni: socio.dni || '',
            nombre: socio.nombre || '',
            apellido: socio.apellido || '',
            correo: socio.correo || '',
            telefono: socio.telefono || '',
            plan: PLANES.includes(socio.plan) ? socio.plan : 'Mensual',
            ficha_medica_entregada: Boolean(socio.ficha_medica_entregada),
          }
        : EMPTY
    );
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
      const payload = { ...form, nombre: form.nombre.trim(), apellido: form.apellido.trim(), correo: form.correo.trim() };
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
      title={isEdit ? 'Editar Socio' : 'Nuevo Socio'}
      subtitle={isEdit ? `Modificá los datos de ${socio?.nombre} ${socio?.apellido}` : 'Completá los datos para dar de alta un socio'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" form="form-socio" id="btn-guardar-socio" className="btn-primary min-w-[150px]" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {isEdit ? 'Guardar cambios' : 'Crear socio'}
          </button>
        </>
      }
    >
      <form id="form-socio" onSubmit={handleSubmit} noValidate className="space-y-5">
        {serverError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 animate-shake">
            {serverError}
          </div>
        )}

        <Field id="socio-dni" label="DNI" error={errors.dni} icon={IdCard}>
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

        <div className="grid gap-5 sm:grid-cols-2">
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

        <div className="grid gap-5 sm:grid-cols-2">
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

        <div>
          <span className="label">Plan</span>
          <div className="grid grid-cols-3 gap-3" role="radiogroup">
            {PLANES.map((p) => {
              const active = form.plan === p;
              return (
                <button
                  type="button"
                  key={p}
                  id={`plan-${p.toLowerCase()}`}
                  role="radio"
                  aria-checked={active}
                  onClick={() => setForm((f) => ({ ...f, plan: p }))}
                  className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-all ${
                    active
                      ? 'border-brand bg-brand/10 text-white shadow-[0_0_20px_-8px_rgba(255,85,0,.8)]'
                      : 'border-line bg-ink-750 text-gray-400 hover:border-line-strong hover:text-white'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
          {errors.plan && <p className="mt-1 text-xs text-red-400">{errors.plan}</p>}
        </div>

        <label
          htmlFor="socio-ficha"
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
