import { useEffect, useRef, useState } from 'react';
import {
  Layers,
  Sparkles,
  DollarSign,
  Image as ImageIcon,
  Plus,
  X,
  Loader2,
  FileText,
  Upload,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import Modal from './Modal.jsx';
import api, { getErrorMessage } from '../api/axios';
import { useToast } from '../context/ToastContext.jsx';

const PRESET_IMAGES = [
  {
    label: 'Musculación',
    url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'CrossFit / HIIT',
    url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Pase Diario',
    url: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Mujeres',
    url: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Kids',
    url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
  },
  {
    label: 'Infanto',
    url: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=800&q=80',
  },
];

const SUGGESTED_BENEFITS = [
  'Musculación',
  'Hayya Cross',
  'Hayya Metabolic',
  'Hayya Mujeres',
  'Hayya Kids',
  'Hayya Infanto',
  'Acceso Ilimitado',
  'Vestuarios y Lockers',
  'Evaluación Física',
];

const EMPTY = {
  nombre: '',
  precio: '',
  descripcion: '',
  imagen_url: '',
  beneficios: [],
  estado: 'Activo',
};

/**
 * Comprime y reescala una imagen seleccionada para un almacenamiento ligero y carga rápida
 */
function processImageFile(file, maxWidth = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('El archivo seleccionado no es una imagen válida.'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          dataUrl,
          name: file.name,
          sizeKb: Math.round(dataUrl.length / 1024),
        });
      };
      img.onerror = () => reject(new Error('Error al procesar la imagen'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export default function ModalPlan({ open, plan, onClose, onSaved }) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const isEdit = Boolean(plan);

  const [form, setForm] = useState(EMPTY);
  const [newBenefit, setNewBenefit] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Tab de gestión de imagen: 'upload' | 'url' | 'presets'
  const [imageMode, setImageMode] = useState('upload');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError('');
    setNewBenefit('');
    setImageError(false);
    setUploadedFileName('');
    setIsDragging(false);

    if (plan) {
      const isBase64 = String(plan.imagen_url || '').startsWith('data:image/');
      setImageMode(isBase64 ? 'upload' : 'url');
      if (isBase64) setUploadedFileName('Imagen cargada');

      setForm({
        nombre: plan.nombre ?? '',
        precio: plan.precio !== undefined ? String(plan.precio) : '',
        descripcion: plan.descripcion ?? '',
        imagen_url: plan.imagen_url ?? '',
        beneficios: Array.isArray(plan.beneficios) ? [...plan.beneficios] : [],
        estado: plan.estado ?? 'Activo',
      });
    } else {
      setImageMode('upload');
      setForm(EMPTY);
    }
  }, [open, plan]);

  const validate = () => {
    const errs = {};
    if (!form.nombre.trim()) errs.nombre = 'El nombre del plan es obligatorio';
    if (form.nombre.trim().length > 100) errs.nombre = 'Máximo 100 caracteres';

    const p = Number(form.precio);
    if (form.precio === '' || form.precio === null || Number.isNaN(p) || p < 0) {
      errs.precio = 'Ingresá un precio válido (mayor o igual a 0)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFile = async (file) => {
    if (!file) return;
    setProcessingImage(true);
    setImageError(false);
    try {
      const { dataUrl, name } = await processImageFile(file);
      setForm((f) => ({ ...f, imagen_url: dataUrl }));
      setUploadedFileName(name);
      toast('Imagen importada correctamente');
    } catch (err) {
      toast(err.message || 'Error al procesar la imagen', 'error');
    } finally {
      setProcessingImage(false);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleAddBenefit = (benefitToAdd) => {
    const val = (benefitToAdd || newBenefit).trim();
    if (!val) return;
    if (form.beneficios.includes(val)) {
      setNewBenefit('');
      return;
    }
    setForm((prev) => ({
      ...prev,
      beneficios: [...prev.beneficios, val],
    }));
    setNewBenefit('');
  };

  const handleRemoveBenefit = (indexToRemove) => {
    setForm((prev) => ({
      ...prev,
      beneficios: prev.beneficios.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        nombre: form.nombre.trim(),
        precio: Number(form.precio),
        descripcion: form.descripcion.trim() || null,
        imagen_url: form.imagen_url.trim() || null,
        beneficios: form.beneficios,
        estado: form.estado,
      };

      let res;
      if (isEdit) {
        res = await api.put(`/admin/planes/${plan.id}`, payload);
        toast(`Plan "${res.data.nombre}" actualizado con éxito`);
      } else {
        res = await api.post('/admin/planes', payload);
        toast(`Plan "${res.data.nombre}" creado exitosamente`);
      }

      onSaved?.(res.data);
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err);
      setServerError(msg);
      if (err.response?.data?.detalles) {
        setErrors(err.response.data.detalles);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEdit ? 'Modificar Plan' : 'Nuevo Plan'}
      subtitle={
        isEdit
          ? 'Actualizá los datos, precio, beneficios y portada de la membresía'
          : 'Completá los campos para crear un nuevo arancel o membresía'
      }
      icon={isEdit ? Sparkles : Layers}
      tour="modal-plan"
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving} data-tour="plan-form-guardar" className="btn btn-primary min-w-[140px]">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : isEdit ? (
              'Guardar Cambios'
            ) : (
              'Crear Plan'
            )}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {serverError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-500/25 bg-red-500/5 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Nombre y Precio */}
        <div data-tour="plan-form-basico" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="plan-nombre" className="label">
              Nombre del Plan *
            </label>
            <input
              id="plan-nombre"
              type="text"
              value={form.nombre}
              onChange={(e) => {
                setForm((f) => ({ ...f, nombre: e.target.value }));
                if (errors.nombre) setErrors((e) => ({ ...e, nombre: '' }));
              }}
              placeholder="Ej: Mensual, Quincenal, 1 Día..."
              className={`input ${errors.nombre ? 'input-error' : ''}`}
              autoFocus
            />
            {errors.nombre && <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>}
          </div>

          <div>
            <label htmlFor="plan-precio" className="label">
              Precio ($ ARS) *
            </label>
            <div className="relative">
              <DollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="plan-precio"
                type="number"
                min="0"
                step="100"
                value={form.precio}
                onChange={(e) => {
                  setForm((f) => ({ ...f, precio: e.target.value }));
                  if (errors.precio) setErrors((e) => ({ ...e, precio: '' }));
                }}
                placeholder="10000"
                className={`input pl-9 ${errors.precio ? 'input-error' : ''}`}
              />
            </div>
            {errors.precio && <p className="mt-1 text-xs text-red-400">{errors.precio}</p>}
          </div>
        </div>

        {/* Descripción */}
        <div data-tour="plan-form-desc">
          <label htmlFor="plan-descripcion" className="label">
            Descripción / Detalle del Plan
          </label>
          <div className="relative">
            <FileText className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <textarea
              id="plan-descripcion"
              rows={2}
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder="Detalle comercial o informativo del plan..."
              className="input pl-9 resize-none"
            />
          </div>
        </div>

        {/* Portada / Imagen */}
        <div data-tour="plan-form-imagen">
          <div className="mb-2 flex items-center justify-between">
            <label className="label mb-0">Imagen de Portada</label>
            {form.imagen_url && (
              <button
                type="button"
                onClick={() => {
                  setForm((f) => ({ ...f, imagen_url: '' }));
                  setUploadedFileName('');
                  setImageError(false);
                }}
                className="text-[11px] text-gray-400 hover:text-white transition-colors"
              >
                Eliminar imagen
              </button>
            )}
          </div>

          {/* Opciones de método: Subir Archivo, Enlace URL, Presets */}
          <div className="mb-3 flex rounded-xl border border-line bg-ink-900/60 p-1">
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                imageMode === 'upload'
                  ? 'bg-brand/15 text-white border border-brand/30 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Importar / Subir</span>
            </button>
            <button
              type="button"
              onClick={() => setImageMode('url')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                imageMode === 'url'
                  ? 'bg-brand/15 text-white border border-brand/30 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Enlace Web (URL)</span>
            </button>
            <button
              type="button"
              onClick={() => setImageMode('presets')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                imageMode === 'presets'
                  ? 'bg-brand/15 text-white border border-brand/30 shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Fotos Recomendadas</span>
            </button>
          </div>

          {/* Modo 1: Subir Archivo desde PC */}
          {imageMode === 'upload' && (
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all ${
                  isDragging
                    ? 'border-brand bg-brand/10'
                    : 'border-line hover:border-line-strong hover:bg-ink-750/50 bg-ink-900/30'
                }`}
              >
                {processingImage ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="h-6 w-6 animate-spin text-brand" />
                    <span className="text-xs text-muted">Procesando y optimizando imagen…</span>
                  </div>
                ) : (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-ink-800 text-brand mb-2">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-semibold text-white">
                      Hacé clic para seleccionar una foto o arrastrala aquí
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      JPG, PNG, WebP o GIF (se comprime automáticamente)
                    </p>
                  </>
                )}
              </div>

              {uploadedFileName && form.imagen_url && (
                <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                  <span className="flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{uploadedFileName}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="ml-2 underline text-white hover:text-brand shrink-0"
                  >
                    Cambiar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modo 2: Enlace Web (URL) */}
          {imageMode === 'url' && (
            <div className="space-y-2">
              <div className="relative">
                <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="plan-imagen-url"
                  type="url"
                  value={form.imagen_url.startsWith('data:image/') ? '' : form.imagen_url}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, imagen_url: e.target.value }));
                    setUploadedFileName('');
                    setImageError(false);
                  }}
                  placeholder="https://images.unsplash.com/... o enlace directo a imagen"
                  className="input pl-9"
                />
              </div>
              {/* Advertencia amigable si parece enlace de página web */}
              {form.imagen_url &&
                !form.imagen_url.startsWith('data:image/') &&
                (form.imagen_url.includes('unsplash.com/fotos') ||
                  form.imagen_url.includes('unsplash.com/es/fotos') ||
                  form.imagen_url.includes('pinterest.com') ||
                  form.imagen_url.includes('google.com/imgres') ||
                  form.imagen_url.includes('instagram.com')) && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <p className="font-semibold">Parece que pegaste el enlace a una página web, no a la imagen directa.</p>
                      <p className="mt-0.5 text-gray-300">
                        Para que se vea correctamente: hacé clic derecho sobre la foto y elegí <strong className="text-white">"Copiar dirección de la imagen"</strong>, o mejor aún, descargala a tu equipo y usá la pestaña <strong className="text-white">"Importar / Subir"</strong>.
                      </p>
                    </div>
                  </div>
                )}
              <p className="text-[11px] text-muted">
                Tip: Pegá el enlace directo a la imagen (terminado en .jpg, .png o de un CDN). Si el sitio bloquea enlaces externos, podés guardar la foto en tu computadora y usar la pestaña <strong className="text-gray-300">"Importar / Subir"</strong>.
              </p>
            </div>
          )}

          {/* Modo 3: Presets Rápidos */}
          {imageMode === 'presets' && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PRESET_IMAGES.map((preset) => {
                const isSelected = form.imagen_url === preset.url;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, imagen_url: preset.url }));
                      setUploadedFileName('');
                      setImageError(false);
                    }}
                    className={`flex items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/15 text-white'
                        : 'border-line bg-ink-750 text-gray-300 hover:border-line-strong hover:bg-ink-700'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="h-9 w-9 rounded-lg object-cover shrink-0"
                    />
                    <span className="text-xs font-semibold truncate">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Vista previa en miniatura */}
          <div className="mt-3 flex items-center gap-4 rounded-xl border border-line bg-ink-900/60 p-3">
            <div className="relative flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-ink-800">
              {form.imagen_url && !imageError ? (
                <img
                  src={form.imagen_url}
                  alt="Vista previa"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="h-6 w-6 stroke-1" />
                  <span className="mt-1 text-[9px] uppercase tracking-wider">Placeholder</span>
                </div>
              )}
            </div>
            <div className="text-xs text-muted leading-relaxed">
              <p className="font-medium text-white">Vista previa del banner de la tarjeta</p>
              <p className="mt-0.5">
                {form.imagen_url
                  ? imageError
                    ? 'No se pudo cargar la imagen desde el enlace (verificá la URL o subí el archivo desde tu PC).'
                    : 'Imagen cargada correctamente y lista para mostrar.'
                  : 'Si no seleccionás una imagen, se mostrará el diseño oscuro con ícono tal como en Figma.'}
              </p>
            </div>
          </div>
        </div>

        {/* Beneficios (INCLUYE:) */}
        <div data-tour="plan-form-beneficios">
          <label className="label">Beneficios incluidos (INCLUYE:)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newBenefit}
              onChange={(e) => setNewBenefit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddBenefit();
                }
              }}
              placeholder="Ej: Musculación, Hayya Cross, Acceso Libre..."
              className="input flex-1"
            />
            <button
              type="button"
              onClick={() => handleAddBenefit()}
              disabled={!newBenefit.trim()}
              className="btn btn-ghost px-3 text-sm shrink-0 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              <span>Agregar</span>
            </button>
          </div>

          {/* Lista actual de beneficios */}
          <div className="mt-3 min-h-[42px] rounded-xl border border-line/60 bg-ink-900/40 p-2.5">
            {form.beneficios.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-1">No hay beneficios cargados todavía para este plan.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {form.beneficios.map((ben, idx) => (
                  <span
                    key={`${ben}-${idx}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] py-1 pl-2.5 pr-1.5 text-xs font-medium text-gray-200 animate-fade-in"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                    <span>{ben}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBenefit(idx)}
                      className="ml-1 rounded p-0.5 text-gray-400 hover:bg-white/10 hover:text-white"
                      title="Eliminar beneficio"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sugerencias rápidas */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-muted mr-1">Sugerencias:</span>
            {SUGGESTED_BENEFITS.map((sug) => {
              const already = form.beneficios.includes(sug);
              return (
                <button
                  key={sug}
                  type="button"
                  disabled={already}
                  onClick={() => handleAddBenefit(sug)}
                  className={`rounded-lg border px-2 py-0.5 text-[11px] transition-colors ${
                    already
                      ? 'border-transparent bg-white/[0.03] text-gray-600 cursor-default'
                      : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {already ? '✓ ' : '+ '}
                  {sug}
                </button>
              );
            })}
          </div>
        </div>

        {/* Estado */}
        <div data-tour="plan-form-estado" className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <div>
            <p className="text-sm font-semibold">Estado del Plan</p>
            <p className="text-xs text-muted">
              {form.estado === 'Activo'
                ? 'El plan está activo y disponible para inscripción de socios.'
                : 'El plan está desactivado y no figurará como opción para nuevos socios.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({
                ...f,
                estado: f.estado === 'Activo' ? 'Inactivo' : 'Activo',
              }))
            }
            className={`btn ${
              form.estado === 'Activo'
                ? 'border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10'
                : 'border border-red-500/25 bg-red-500/5 text-red-400 hover:bg-red-500/10'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                form.estado === 'Activo' ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            {form.estado}
          </button>
        </div>
      </form>
    </Modal>
  );
}
