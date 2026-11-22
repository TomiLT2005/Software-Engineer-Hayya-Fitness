const express = require('express');
const db = require('../config/db');
const { asyncHandler, escapeLike, isUuid } = require('../utils/helpers');

const router = express.Router();

// Valida :id como UUID
router.param('id', (req, res, next, id) => {
  if (!isUuid(id)) return res.status(400).json({ error: 'ID de plan inválido' });
  return next();
});

/**
 * Normaliza y valida el payload de un plan
 */
function validatePlanPayload(body = {}) {
  const errors = {};
  const nombre = String(body.nombre ?? '').trim();
  const descripcion = String(body.descripcion ?? '').trim();
  const precioRaw = body.precio;
  const precio = typeof precioRaw === 'string'
    ? Number(precioRaw.trim().replace(',', '.'))
    : Number(precioRaw);
  const imagen_url = String(body.imagen_url ?? '').trim() || null;
  const estado = body.estado === 'Inactivo' ? 'Inactivo' : 'Activo';

  let beneficios = [];
  if (Array.isArray(body.beneficios)) {
    beneficios = body.beneficios.map((b) => String(b).trim()).filter(Boolean);
  } else if (typeof body.beneficios === 'string' && body.beneficios.trim()) {
    try {
      const parsed = JSON.parse(body.beneficios);
      if (Array.isArray(parsed)) {
        beneficios = parsed.map((b) => String(b).trim()).filter(Boolean);
      } else {
        beneficios = body.beneficios.split('\n').map((b) => b.trim()).filter(Boolean);
      }
    } catch {
      beneficios = body.beneficios.split('\n').map((b) => b.trim()).filter(Boolean);
    }
  }

  if (!nombre) {
    errors.nombre = 'El nombre del plan es obligatorio';
  } else if (nombre.length > 100) {
    errors.nombre = 'El nombre no puede superar los 100 caracteres';
  }

  if (precioRaw === undefined || precioRaw === null || precioRaw === '' || Number.isNaN(precio) || precio < 0) {
    errors.precio = 'El precio debe ser un número válido mayor o igual a 0';
  }

  const precioFinal = Number.isNaN(precio) ? 0 : Math.round(precio * 100) / 100;

  return {
    errors,
    data: {
      nombre,
      descripcion: descripcion || null,
      precio: precioFinal,
      beneficios,
      imagen_url,
      estado,
    },
  };
}

/**
 * GET /api/admin/planes
 * Lista planes con soporte de búsqueda y filtro por estado
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const search = String(req.query.search ?? '').trim().slice(0, 100);
    const estado = String(req.query.estado ?? '').trim();

    const where = [];
    const params = [];

    if (search) {
      params.push(`%${escapeLike(search)}%`);
      where.push(`(nombre ILIKE $${params.length} OR descripcion ILIKE $${params.length})`);
    }

    if (estado === 'Activo') {
      where.push(`estado = 'Activo'`);
    } else if (estado === 'Inactivo') {
      where.push(`estado = 'Inactivo'`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT id, nombre, descripcion, precio::float AS precio, beneficios, imagen_url, estado, orden, created_at, updated_at
      FROM planes
      ${whereSql}
      ORDER BY orden ASC, created_at ASC
    `;

    const { rows } = await db.query(sql, params);

    // Contadores para filtros
    const counts = await db.query(`
      SELECT 
        COUNT(*)::int AS total,
        COUNT(CASE WHEN estado = 'Activo' THEN 1 END)::int AS activos,
        COUNT(CASE WHEN estado = 'Inactivo' THEN 1 END)::int AS inactivos
      FROM planes
    `);

    res.json({
      planes: rows,
      meta: counts.rows[0] || { total: rows.length, activos: rows.length, inactivos: 0 },
    });
  })
);

/**
 * GET /api/admin/planes/:id
 * Detalle de un plan específico
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, nombre, descripcion, precio::float AS precio, beneficios, imagen_url, estado, orden, created_at, updated_at 
       FROM planes WHERE id = $1`,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    res.json(rows[0]);
  })
);

/**
 * POST /api/admin/planes
 * Crea un nuevo plan
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { errors, data } = validatePlanPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors });
    }

    // Verificar si ya existe un plan con el mismo nombre (case insensitive)
    const existing = await db.query('SELECT id FROM planes WHERE LOWER(nombre) = LOWER($1)', [data.nombre]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un plan con este nombre', detalles: { nombre: 'Nombre ya utilizado' } });
    }

    // Calcular próximo orden
    const maxOrderRes = await db.query('SELECT COALESCE(MAX(orden), 0) + 1 AS next_order FROM planes');
    const orden = maxOrderRes.rows[0].next_order;

    const insertSql = `
      INSERT INTO planes (nombre, descripcion, precio, beneficios, imagen_url, estado, orden)
      VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
      RETURNING id, nombre, descripcion, precio::float AS precio, beneficios, imagen_url, estado, orden, created_at, updated_at
    `;

    const { rows } = await db.query(insertSql, [
      data.nombre,
      data.descripcion,
      data.precio,
      JSON.stringify(data.beneficios),
      data.imagen_url,
      data.estado,
      orden,
    ]);

    res.status(201).json(rows[0]);
  })
);

/**
 * PUT /api/admin/planes/:id
 * Actualiza completamente un plan existente
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { errors, data } = validatePlanPayload(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors });
    }

    // Verificar que el plan exista
    const target = await db.query('SELECT id FROM planes WHERE id = $1', [req.params.id]);
    if (!target.rows.length) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    // Verificar unicidad de nombre excluyendo el actual
    const conflict = await db.query(
      'SELECT id FROM planes WHERE LOWER(nombre) = LOWER($1) AND id != $2',
      [data.nombre, req.params.id]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe otro plan con este nombre', detalles: { nombre: 'Nombre ya utilizado' } });
    }

    const updateSql = `
      UPDATE planes
      SET nombre = $1,
          descripcion = $2,
          precio = $3,
          beneficios = $4::jsonb,
          imagen_url = $5,
          estado = $6,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, nombre, descripcion, precio::float AS precio, beneficios, imagen_url, estado, orden, created_at, updated_at
    `;

    const { rows } = await db.query(updateSql, [
      data.nombre,
      data.descripcion,
      data.precio,
      JSON.stringify(data.beneficios),
      data.imagen_url,
      data.estado,
      req.params.id,
    ]);

    res.json(rows[0]);
  })
);

/**
 * PATCH /api/admin/planes/:id/estado
 * Alterna el estado (Activo <-> Inactivo) o establece el valor recibido
 */
router.patch(
  '/:id/estado',
  asyncHandler(async (req, res) => {
    const { rows: current } = await db.query('SELECT id, estado FROM planes WHERE id = $1', [req.params.id]);
    if (!current.length) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }

    let nuevoEstado;
    if (req.body && (req.body.estado === 'Activo' || req.body.estado === 'Inactivo')) {
      nuevoEstado = req.body.estado;
    } else {
      nuevoEstado = current[0].estado === 'Activo' ? 'Inactivo' : 'Activo';
    }

    const { rows } = await db.query(
      `UPDATE planes 
       SET estado = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, nombre, descripcion, precio::float AS precio, beneficios, imagen_url, estado, orden, created_at, updated_at`,
      [nuevoEstado, req.params.id]
    );

    res.json(rows[0]);
  })
);

/**
 * DELETE /api/admin/planes/:id
 * Elimina un plan
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query('DELETE FROM planes WHERE id = $1 RETURNING id, nombre', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Plan no encontrado' });
    }
    res.json({ ok: true, eliminado: rows[0] });
  })
);

module.exports = router;
