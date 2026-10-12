const PLANES = ['Mensual', 'Quincenal', 'Diario'];
const ESTADOS = ['Activo', 'Inactivo'];

const DNI_RE = /^\d{6,10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[\d\s+()-]{6,20}$/;
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ' .-]{1,100}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Envuelve handlers async para que Express 4 capture los errores. */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Quita puntos, espacios y guiones: "42.109.832" -> "42109832" */
const normalizeDni = (v) => String(v ?? '').replace(/[.\s-]/g, '').trim();

/** Escapa comodines de LIKE/ILIKE para que el usuario no los inyecte. */
const escapeLike = (v) => String(v).replace(/[\\%_]/g, (c) => `\\${c}`);

const isUuid = (v) => UUID_RE.test(String(v || ''));

/**
 * Valida y normaliza el body de alta/edición de socio.
 * @returns {{ errors: Record<string,string>, data: object }}
 */
function validateSocio(body = {}) {
  const errors = {};
  const data = {
    dni: normalizeDni(body.dni),
    nombre: String(body.nombre ?? '').trim(),
    apellido: String(body.apellido ?? '').trim(),
    correo: String(body.correo ?? '').trim().toLowerCase() || null,
    telefono: String(body.telefono ?? '').trim() || null,
    plan: String(body.plan ?? '').trim(),
    ficha_medica_entregada: body.ficha_medica_entregada === true || body.ficha_medica_entregada === 'true',
  };

  if (!DNI_RE.test(data.dni)) errors.dni = 'El DNI debe tener entre 6 y 10 dígitos';
  if (!NAME_RE.test(data.nombre)) errors.nombre = 'Nombre inválido';
  if (!NAME_RE.test(data.apellido)) errors.apellido = 'Apellido inválido';
  if (data.correo && (!EMAIL_RE.test(data.correo) || data.correo.length > 255)) errors.correo = 'Correo inválido';
  if (data.telefono && !PHONE_RE.test(data.telefono)) errors.telefono = 'Teléfono inválido';
  if (!PLANES.includes(data.plan)) errors.plan = `El plan debe ser: ${PLANES.join(', ')}`;

  return { errors, data };
}

module.exports = {
  PLANES,
  ESTADOS,
  DNI_RE,
  EMAIL_RE,
  asyncHandler,
  normalizeDni,
  escapeLike,
  isUuid,
  validateSocio,
};
