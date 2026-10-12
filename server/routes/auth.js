const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const { COOKIE_NAME } = require('../middleware/authMiddleware');
const { asyncHandler, EMAIL_RE } = require('../utils/helpers');

const router = express.Router();

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000; // 8 horas
const isProd = process.env.NODE_ENV === 'production';
const sameSite = process.env.COOKIE_SAMESITE || 'lax';

const cookieOptions = {
  httpOnly: true,
  secure: isProd || sameSite === 'none',
  sameSite,
  path: '/',
};

// Hash ficticio para que el tiempo de respuesta sea similar exista o no el usuario
// (mitiga la enumeración de cuentas por timing).
const DUMMY_HASH = bcrypt.hashSync('vortex-dummy-password', 10);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
});

/**
 * POST /api/auth/login
 */
router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const correo = String(req.body?.correo ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');

    if (!EMAIL_RE.test(correo) || !password || password.length > 200) {
      return res.status(400).json({ error: 'Correo o contraseña inválidos' });
    }

    const { rows } = await db.query(
      'SELECT id, correo, password_hash, nombre, rol FROM usuarios WHERE correo = $1',
      [correo]
    );
    const user = rows[0];

    const ok = await bcrypt.compare(password, user ? user.password_hash : DUMMY_HASH);
    if (!user || !ok) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { sub: user.id, correo: user.correo, nombre: user.nombre, rol: user.rol },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: Math.floor(TOKEN_TTL_MS / 1000) }
    );

    res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: TOKEN_TTL_MS });

    return res.json({
      user: { id: user.id, correo: user.correo, nombre: user.nombre, rol: user.rol },
    });
  })
);

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
  return res.json({ ok: true });
});

/**
 * GET /api/auth/me  — devuelve el usuario de la sesión actual
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query(
      'SELECT id, correo, nombre, rol FROM usuarios WHERE id = $1',
      [req.user.id]
    );
    if (!rows[0]) {
      res.clearCookie(COOKIE_NAME, cookieOptions);
      return res.status(401).json({ error: 'Usuario inexistente' });
    }
    return res.json({ user: rows[0] });
  })
);

module.exports = router;
