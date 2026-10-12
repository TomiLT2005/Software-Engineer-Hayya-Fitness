const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

if (!process.env.DATABASE_URL) {
  console.error('[db] Falta la variable DATABASE_URL en el archivo .env');
  process.exit(1);
}

/**
 * Supabase usa certificados que `pg` no puede verificar por defecto.
 * Si la URL trae `?sslmode=require`, pg lo interpreta como verificación
 * estricta y sobrescribe nuestra config SSL, provocando el error
 * "self-signed certificate in certificate chain". Por eso lo removemos
 * y configuramos SSL de forma explícita.
 */
function buildConnectionString(raw) {
  try {
    const url = new URL(raw);
    url.searchParams.delete('sslmode');
    return url.toString();
  } catch {
    return raw;
  }
}

const connectionString = buildConnectionString(process.env.DATABASE_URL);
const isLocal = /@(localhost|127\.0\.0\.1)(:|\/)/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('[db] Error inesperado en un cliente inactivo:', err.message);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
