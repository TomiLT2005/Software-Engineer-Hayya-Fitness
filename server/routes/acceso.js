const express = require('express');
const db = require('../config/db');
const { asyncHandler, normalizeDni, DNI_RE } = require('../utils/helpers');

const TIMEZONE = process.env.APP_TIMEZONE || 'America/Argentina/Buenos_Aires';
const PUNTOS_POR_INGRESO = 10;

// ============================================================
// Router público: usado por el Tótem (/terminal)
// ============================================================
const publicRouter = express.Router();

/**
 * POST /api/acceso/validar  { dni }
 * Reglas: existe + estado 'Activo' + ficha médica entregada => PERMITIDO
 */
publicRouter.post(
  '/validar',
  asyncHandler(async (req, res) => {
    const dni = normalizeDni(req.body?.dni);
    if (!DNI_RE.test(dni)) {
      return res.status(400).json({ error: 'Ingresá un DNI válido (6 a 10 dígitos)' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows } = await client.query('SELECT * FROM socios WHERE dni = $1', [dni]);
      const socio = rows[0];

      let acceso = 'DENEGADO';
      let tipo;
      let motivo;

      if (!socio) {
        tipo = 'no_registrado';
        motivo = 'DNI No Registrado';
      } else if (socio.estado !== 'Activo') {
        tipo = 'inactivo';
        motivo = 'Membresía Inactiva';
      } else if (socio.ficha_medica_entregada !== true) {
        tipo = 'ficha';
        motivo = 'Ficha Médica Pendiente';
      } else {
        acceso = 'PERMITIDO';
        tipo = 'ok';
        motivo = 'Acceso Correcto';
      }

      let puntos = socio ? socio.puntos : 0;
      if (acceso === 'PERMITIDO') {
        const upd = await client.query(
          'UPDATE socios SET puntos = COALESCE(puntos, 0) + $1 WHERE id = $2 RETURNING puntos',
          [PUNTOS_POR_INGRESO, socio.id]
        );
        puntos = upd.rows[0].puntos;
      }

      const nombreCompleto = socio ? `${socio.nombre} ${socio.apellido}` : null;

      const log = await client.query(
        `INSERT INTO registro_accesos (socio_id, dni_ingresado, nombre_socio, estado_acceso, motivo)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING fecha_hora`,
        [socio ? socio.id : null, dni, nombreCompleto, acceso, motivo]
      );

      await client.query('COMMIT');

      return res.json({
        acceso,
        tipo,
        motivo,
        fecha_hora: log.rows[0].fecha_hora,
        socio: socio
          ? {
              nombre: socio.nombre,
              apellido: socio.apellido,
              plan: socio.plan,
              puntos,
              puntosGanados: acceso === 'PERMITIDO' ? PUNTOS_POR_INGRESO : 0,
            }
          : null,
      });
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  })
);

// ============================================================
// Router protegido: Dashboard de Inicio (/api/admin/accesos)
// ============================================================
const adminRouter = express.Router();

const HOY_SQL = `(fecha_hora AT TIME ZONE $1)::date = (NOW() AT TIME ZONE $1)::date`;

/**
 * GET /api/admin/accesos/resumen — totales del día + distribución por hora
 */
adminRouter.get(
  '/resumen',
  asyncHandler(async (req, res) => {
    const totales = await db.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE estado_acceso = 'PERMITIDO')::int AS permitidos,
              COUNT(*) FILTER (WHERE estado_acceso = 'DENEGADO')::int AS denegados
       FROM registro_accesos
       WHERE ${HOY_SQL}`,
      [TIMEZONE]
    );

    const porHora = await db.query(
      `SELECT EXTRACT(HOUR FROM fecha_hora AT TIME ZONE $1)::int AS hora,
              COUNT(*) FILTER (WHERE estado_acceso = 'PERMITIDO')::int AS permitidos,
              COUNT(*) FILTER (WHERE estado_acceso = 'DENEGADO')::int AS denegados
       FROM registro_accesos
       WHERE ${HOY_SQL}
       GROUP BY 1
       ORDER BY 1`,
      [TIMEZONE]
    );

    const motivos = await db.query(
      `SELECT motivo, COUNT(*)::int AS total
       FROM registro_accesos
       WHERE estado_acceso = 'DENEGADO' AND ${HOY_SQL}
       GROUP BY motivo
       ORDER BY total DESC`,
      [TIMEZONE]
    );

    res.json({ ...totales.rows[0], porHora: porHora.rows, motivos: motivos.rows });
  })
);

/**
 * GET /api/admin/accesos/recientes — últimos 10 intentos
 */
adminRouter.get(
  '/recientes',
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      `SELECT id, socio_id, dni_ingresado, nombre_socio, estado_acceso, motivo, fecha_hora
       FROM registro_accesos
       ORDER BY fecha_hora DESC
       LIMIT 10`
    );
    res.json({ data: rows });
  })
);

module.exports = { publicRouter, adminRouter };
