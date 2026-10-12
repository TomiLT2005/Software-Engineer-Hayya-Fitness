const express = require('express');
const db = require('../config/db');
const {
  asyncHandler,
  escapeLike,
  isUuid,
  validateSocio,
  normalizeDni,
  PLANES,
} = require('../utils/helpers');

const router = express.Router();

const SOCIO_COLUMNS =
  'id, dni, nombre, apellido, correo, telefono, plan, ficha_medica_entregada, estado, puntos, created_at';

// Valida :id antes de llegar a PostgreSQL (evita errores 22P02 de UUID inválido)
router.param('id', (req, res, next, id) => {
  if (!isUuid(id)) return res.status(400).json({ error: 'ID inválido' });
  return next();
});

/**
 * GET /api/admin/socios/stats — KPIs
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const total = await db.query('SELECT COUNT(*)::int AS count FROM socios');
    const activos = await db.query("SELECT COUNT(*)::int AS count FROM socios WHERE estado = 'Activo'");
    const inactivos = await db.query("SELECT COUNT(*)::int AS count FROM socios WHERE estado != 'Activo'");
    const fichas = await db.query(
      'SELECT COUNT(*)::int AS count FROM socios WHERE ficha_medica_entregada IS NOT TRUE'
    );

    res.json({
      total: total.rows[0].count,
      activos: activos.rows[0].count,
      inactivos: inactivos.rows[0].count,
      fichasPendientes: fichas.rows[0].count,
    });
  })
);

/**
 * GET /api/admin/socios?search=&estado=&plan=&page=&limit=
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const search = String(req.query.search ?? '').trim().slice(0, 100);
    const estado = String(req.query.estado ?? '');
    const plan = String(req.query.plan ?? '');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 8));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (search) {
      params.push(`%${escapeLike(search)}%`);
      const term = `$${params.length}`;
      params.push(`%${escapeLike(normalizeDni(search) || search)}%`);
      const dniTerm = `$${params.length}`;
      where.push(
        `(dni ILIKE ${dniTerm} OR nombre ILIKE ${term} OR apellido ILIKE ${term} OR (nombre || ' ' || apellido) ILIKE ${term})`
      );
    }
    // Mismo criterio que los KPIs: "Inactivo" = todo lo que no sea 'Activo'
    if (estado === 'Activo') where.push(`estado = 'Activo'`);
    else if (estado === 'Inactivo') where.push(`estado != 'Activo'`);
    if (PLANES.includes(plan)) {
      params.push(plan);
      where.push(`plan = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM socios ${whereSql}`, params);

    const dataResult = await db.query(
      `SELECT ${SOCIO_COLUMNS} FROM socios ${whereSql}
       ORDER BY created_at DESC, apellido ASC
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
 * GET /api/admin/socios/:id — ficha completa + últimos accesos
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(`SELECT ${SOCIO_COLUMNS} FROM socios WHERE id = $1`, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Socio no encontrado' });

    const accesos = await db.query(
      `SELECT id, estado_acceso, motivo, fecha_hora
       FROM registro_accesos WHERE socio_id = $1
       ORDER BY fecha_hora DESC LIMIT 5`,
      [req.params.id]
    );
    const totales = await db.query(
      `SELECT COUNT(*) FILTER (WHERE estado_acceso = 'PERMITIDO')::int AS visitas,
              MAX(fecha_hora) FILTER (WHERE estado_acceso = 'PERMITIDO') AS ultima_visita
       FROM registro_accesos WHERE socio_id = $1`,
      [req.params.id]
    );

    res.json({ socio: rows[0], accesos: accesos.rows, resumen: totales.rows[0] });
  })
);

/**
 * POST /api/admin/socios — alta
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { errors, data } = validateSocio(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Datos inválidos', fields: errors });

    const exists = await db.query('SELECT id FROM socios WHERE dni = $1', [data.dni]);
    if (exists.rows.length) {
      return res.status(409).json({ error: 'Ya existe un socio con ese DNI', fields: { dni: 'DNI ya registrado' } });
    }

    const { rows } = await db.query(
      `INSERT INTO socios (dni, nombre, apellido, correo, telefono, plan, ficha_medica_entregada, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Activo')
       RETURNING ${SOCIO_COLUMNS}`,
      [data.dni, data.nombre, data.apellido, data.correo, data.telefono, data.plan, data.ficha_medica_entregada]
    );

    res.status(201).json({ socio: rows[0] });
  })
);

/**
 * PUT /api/admin/socios/:id — edición
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { errors, data } = validateSocio(req.body);
    if (Object.keys(errors).length) return res.status(400).json({ error: 'Datos inválidos', fields: errors });

    const dup = await db.query('SELECT id FROM socios WHERE dni = $1 AND id <> $2', [data.dni, req.params.id]);
    if (dup.rows.length) {
      return res.status(409).json({ error: 'Otro socio ya usa ese DNI', fields: { dni: 'DNI ya registrado' } });
    }

    const { rows } = await db.query(
      `UPDATE socios
       SET dni = $1, nombre = $2, apellido = $3, correo = $4, telefono = $5, plan = $6, ficha_medica_entregada = $7
       WHERE id = $8
       RETURNING ${SOCIO_COLUMNS}`,
      [data.dni, data.nombre, data.apellido, data.correo, data.telefono, data.plan, data.ficha_medica_entregada, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Socio no encontrado' });

    res.json({ socio: rows[0] });
  })
);

/**
 * PATCH /api/admin/socios/:id/estado — alterna Activo / Inactivo
 */
router.patch(
  '/:id/estado',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `UPDATE socios
       SET estado = CASE WHEN estado = 'Activo' THEN 'Inactivo' ELSE 'Activo' END
       WHERE id = $1
       RETURNING ${SOCIO_COLUMNS}`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Socio no encontrado' });
    res.json({ socio: rows[0] });
  })
);

/**
 * DELETE /api/admin/socios/:id — baja definitiva
 * (los registros de acceso se conservan: socio_id pasa a NULL por la FK)
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query('DELETE FROM socios WHERE id = $1 RETURNING id', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Socio no encontrado' });
    res.json({ ok: true, id: rows[0].id });
  })
);

module.exports = router;
