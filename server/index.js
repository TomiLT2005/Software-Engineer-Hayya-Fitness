const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

if (!process.env.JWT_SECRET) {
  console.error('[server] Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.warn('[server] ⚠ JWT_SECRET es corto. Usá al menos 32 caracteres aleatorios.');
}

const db = require('./config/db');
const authMiddleware = require('./middleware/authMiddleware');
const authRoutes = require('./routes/auth');
const sociosRoutes = require('./routes/socios');
const planesRoutes = require('./routes/planes');
const pagosRoutes = require('./routes/pagos');
const acceso = require('./routes/acceso');

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

if (process.env.TRUST_PROXY) app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(helmet());
app.use(
  cors({
    origin(origin, cb) {
      // Permite peticiones sin Origin (curl, mismo origen vía proxy de Vite)
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// ---------- Salud ----------
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, db: 'conectada' });
  } catch (err) {
    res.status(503).json({ ok: false, db: 'sin conexión', detalle: err.message });
  }
});

// ---------- Rutas públicas ----------
app.use('/api/auth', authRoutes);

// ---------- Control de Acceso (Protegido: solo administradores) ----------
const totemLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Esperá un momento.' },
});
app.use('/api/acceso', authMiddleware, totemLimiter, acceso.publicRouter);

// ---------- Rutas protegidas (/api/admin/* y /api/pagos) ----------
app.use('/api/pagos', authMiddleware, pagosRoutes);
app.use('/api/admin', authMiddleware);
app.use('/api/admin/socios', sociosRoutes);
app.use('/api/admin/planes', planesRoutes);
app.use('/api/admin/pagos', pagosRoutes);
app.use('/api/admin/accesos', acceso.adminRouter);

// ---------- 404 ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// ---------- Manejo de errores ----------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON mal formado' });
  }
  if (err.message === 'Origen no permitido por CORS') {
    return res.status(403).json({ error: err.message });
  }
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Registro duplicado' });
  }
  console.error('[server] Error:', err);
  return res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, async () => {
  console.log(`\n🏋️  VortexManager API escuchando en http://localhost:${PORT}`);
  try {
    await db.query('SELECT 1');
    console.log('✅ Conexión a PostgreSQL (Supabase) OK\n');
  } catch (err) {
    console.error('❌ No se pudo conectar a PostgreSQL:', err.message, '\n');
  }
});
