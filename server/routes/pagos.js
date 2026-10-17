const express = require('express');
const db = require('../config/db');
const { asyncHandler, escapeLike, isUuid, normalizeDni } = require('../utils/helpers');

const router = express.Router();

const RAW_TIMEZONE = process.env.APP_TIMEZONE || 'America/Argentina/Buenos_Aires';
// Sanitizamos el string de zona horaria para asegurar que sea seguro usar en el SQL
const TIMEZONE = RAW_TIMEZONE.replace(/[^a-zA-Z0-9_\/-]/g, '');
const DIA_LIMITE_MORA = 10;
const PORCENTAJE_MORA = 0.1;
const METODOS = ['Efectivo', 'Transferencia'];

/** "Hoy" según la zona horaria del club (Supabase corre en UTC) */
const HOY_SQL = `(NOW() AT TIME ZONE '${TIMEZONE}')::date`;

/** Duración de la membresía que se extiende según el plan abonado. */
function intervaloPorPlan(plan) {
  const p = String(plan).toLowerCase();
  if (p === 'quincenal') return '15 days';
  if (p === '1 día' || p === '1 dia' || p === 'diario') return '1 day';
  return '1 month';
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Calcula el cobro aplicando la regla de mora:
 * recargo del 10% si hoy es posterior al día 10 Y la membresía anterior ya estaba vencida.
 * Se usa tanto para la vista previa como al registrar el pago (fuente única de verdad).
 */
async function cotizar(client, socioId, planNombre, { lock = false } = {}) {
  const socioRes = await client.query(
    `SELECT s.id, s.dni, s.nombre, s.apellido, s.plan,
            to_char(s.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento,
            to_char(${HOY_SQL}, 'YYYY-MM-DD') AS hoy,
            EXTRACT(DAY FROM ${HOY_SQL})::int AS dia_mes,
            (s.fecha_vencimiento IS NOT NULL AND s.fecha_vencimiento < ${HOY_SQL}) AS estaba_vencido
     FROM socios s
     WHERE s.id = $1
     ${lock ? 'FOR UPDATE' : ''}`,
    [socioId]
  );
  const socio = socioRes.rows[0];
  if (!socio) return { error: { status: 404, message: 'Socio no encontrado' } };

  const planRes = await client.query(
    `SELECT nombre, precio FROM planes WHERE nombre = $1 AND estado = 'Activo'`,
    [planNombre]
  );
  const plan = planRes.rows[0];
  if (!plan) return { error: { status: 400, message: 'Seleccioná un plan activo válido', field: 'plan' } };

  const montoBase = round2(Number(plan.precio));
  if (!(montoBase > 0)) {
    return { error: { status: 400, message: 'El plan no tiene un precio configurado', field: 'plan' } };
  }

  const aplicaMora = socio.dia_mes > DIA_LIMITE_MORA;
  const recargoMora = aplicaMora ? round2(montoBase * PORCENTAJE_MORA) : 0;

  return {
    socio,
    cotizacion: {
      plan: plan.nombre,
      hoy: socio.hoy,
      dia_mes: socio.dia_mes,
      estaba_vencido: socio.estaba_vencido,
      aplica_mora: aplicaMora,
      porcentaje_mora: PORCENTAJE_MORA * 100,
      dia_limite_mora: DIA_LIMITE_MORA,
      monto_base: montoBase,
      recargo_mora: recargoMora,
      monto_total: round2(montoBase + recargoMora),
      intervalo: intervaloPorPlan(plan.nombre),
    },
  };
}

/** Construye WHERE para búsqueda + filtros de la tabla de estado de cuentas. */
function buildFilters(query) {
  const search = String(query.search ?? '').trim().slice(0, 100);
  const estado = String(query.estado ?? '');
  const plan = String(query.plan ?? '').trim();

  const where = [];
  const params = [];

  if (search) {
    params.push(`%${escapeLike(search)}%`);
    const term = `$${params.length}`;
    params.push(`%${escapeLike(normalizeDni(search) || search)}%`);
    const dniTerm = `$${params.length}`;
    where.push(
      `(s.dni ILIKE ${dniTerm} OR s.nombre ILIKE ${term} OR s.apellido ILIKE ${term} OR (s.nombre || ' ' || s.apellido) ILIKE ${term})`
    );
  }
  if (estado === 'al_dia') where.push(`s.fecha_vencimiento >= ${HOY_SQL}`);
  else if (estado === 'vencido') where.push(`(s.fecha_vencimiento IS NULL OR s.fecha_vencimiento < ${HOY_SQL})`);
  if (plan) {
    params.push(plan);
    where.push(`s.plan = $${params.length}`);
  }

  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

/**
 * GET /api/admin/pagos/kpis — Total socios / Al día / Vencidos
 * (los socios sin ningún pago registrado se consideran vencidos)
 */
router.get(
  '/kpis',
  asyncHandler(async (req, res) => {
    const total = await db.query('SELECT COUNT(*)::int AS count FROM socios');
    const alDia = await db.query(
      `SELECT COUNT(*)::int AS count FROM socios WHERE fecha_vencimiento >= ${HOY_SQL}`
    );
    const vencidos = await db.query(
      `SELECT COUNT(*)::int AS count FROM socios WHERE fecha_vencimiento IS NULL OR fecha_vencimiento < ${HOY_SQL}`
    );

    res.json({
      total: total.rows[0].count,
      alDia: alDia.rows[0].count,
      vencidos: vencidos.rows[0].count,
    });
  })
);

/**
 * GET /api/admin/pagos?search=&estado=al_dia|vencido&plan=&page=&limit=
 * Estado de cuentas de los socios.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));
    const offset = (page - 1) * limit;
    const { whereSql, params } = buildFilters(req.query);

    const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM socios s ${whereSql}`, params);

    const dataResult = await db.query(
      `SELECT s.id, s.dni, s.nombre, s.apellido, s.plan,
              to_char(s.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento,
              CASE WHEN s.fecha_vencimiento >= ${HOY_SQL} THEN 'Pagado' ELSE 'Vencido' END AS estado_pago
       FROM socios s
       ${whereSql}
       ORDER BY s.fecha_vencimiento ASC NULLS FIRST, s.apellido ASC, s.nombre ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const total = countResult.rows[0].total;
    res.json({
      data: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  })
);

/**
 * GET /api/admin/pagos/cotizacion?socioId=&plan=
 * Vista previa del cobro (monto base + recargo por mora) calculada en el servidor.
 */
router.get(
  '/cotizacion',
  asyncHandler(async (req, res) => {
    const socioId = String(req.query.socioId ?? '');
    const plan = String(req.query.plan ?? '').trim();
    if (!isUuid(socioId)) return res.status(400).json({ error: 'Socio inválido' });
    if (!plan) return res.status(400).json({ error: 'Seleccioná un plan' });

    const result = await cotizar(db, socioId, plan);
    if (result.error) return res.status(result.error.status).json({ error: result.error.message });
    res.json({ cotizacion: result.cotizacion });
  })
);

/**
 * GET /api/admin/pagos/historial/:socioId — todos los pagos del socio
 */
router.get(
  '/historial/:socioId',
  asyncHandler(async (req, res) => {
    const { socioId } = req.params;
    if (!isUuid(socioId)) return res.status(400).json({ error: 'Socio inválido' });

    const socioRes = await db.query(
      `SELECT id, dni, nombre, apellido, plan,
              to_char(fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento,
              CASE WHEN fecha_vencimiento >= ${HOY_SQL} THEN 'Pagado' ELSE 'Vencido' END AS estado_pago
       FROM socios WHERE id = $1`,
      [socioId]
    );
    if (!socioRes.rows[0]) return res.status(404).json({ error: 'Socio no encontrado' });

    const pagos = await db.query(
      `SELECT id, plan_abonado, monto_base, recargo_mora, monto_total, metodo_pago, comprobante_ref, fecha_pago
       FROM pagos
       WHERE socio_id = $1
       ORDER BY fecha_pago DESC`,
      [socioId]
    );

    res.json({ socio: socioRes.rows[0], pagos: pagos.rows });
  })
);

/**
 * POST /api/admin/pagos  { socio_id, plan, metodo_pago, comprobante_ref }
 * Transacción: registra el pago y renueva la membresía del socio.
 * El monto se recalcula en el servidor; nunca se confía en el que envía el cliente.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const socioId = String(req.body?.socio_id ?? '');
    const plan = String(req.body?.plan ?? '').trim();
    const metodo = String(req.body?.metodo_pago ?? '');
    const comprobante = String(req.body?.comprobante_ref ?? '').trim() || null;

    const fields = {};
    if (!isUuid(socioId)) fields.socio_id = 'Seleccioná un socio';
    if (!plan) fields.plan = 'Seleccioná un plan';
    if (!METODOS.includes(metodo)) fields.metodo_pago = 'Método de pago inválido';
    if (metodo === 'Transferencia' && !comprobante) fields.comprobante_ref = 'El comprobante es obligatorio para transferencias';
    if (comprobante && comprobante.length > 100) fields.comprobante_ref = 'Máximo 100 caracteres';
    if (Object.keys(fields).length) return res.status(400).json({ error: 'Datos inválidos', fields });

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // FOR UPDATE evita dobles cobros concurrentes sobre el mismo socio
      const result = await cotizar(client, socioId, plan, { lock: true });
      if (result.error) {
        await client.query('ROLLBACK');
        return res.status(result.error.status).json({
          error: result.error.message,
          fields: result.error.field ? { [result.error.field]: result.error.message } : undefined,
        });
      }
      const { socio, cotizacion: c } = result;

      // Si todavía estaba al día, se extiende desde su vencimiento; si no, desde hoy.
      const upd = await client.query(
        `UPDATE socios
         SET estado = 'Activo',
             plan = $2,
             fecha_vencimiento = (GREATEST(${HOY_SQL}, COALESCE(fecha_vencimiento, ${HOY_SQL})) + $3::interval)::date
         WHERE id = $1
         RETURNING to_char(fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento`,
        [socioId, c.plan, c.intervalo]
      );
      const nuevoVencimiento = upd.rows[0].fecha_vencimiento;

      const ins = await client.query(
        `INSERT INTO pagos (socio_id, plan_abonado, monto_base, recargo_mora, monto_total, metodo_pago, comprobante_ref)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, plan_abonado, monto_base, recargo_mora, monto_total, metodo_pago, comprobante_ref, fecha_pago`,
        [
          socioId,
          c.plan,
          c.monto_base,
          c.recargo_mora,
          c.monto_total,
          metodo,
          comprobante,
        ]
      );

      await client.query('COMMIT');

      return res.status(201).json({
        pago: ins.rows[0],
        socio: { id: socio.id, nombre: socio.nombre, apellido: socio.apellido, fecha_vencimiento: nuevoVencimiento },
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  })
);

module.exports = router;
