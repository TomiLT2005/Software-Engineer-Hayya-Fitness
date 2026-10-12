/**
 * Crea las tablas (si no existen), carga socios de prueba y crea/actualiza
 * el administrador con un hash bcrypt REAL.
 *
 * Uso:  npm run db:setup
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@hayya.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  console.log('→ Conectando a PostgreSQL...');
  await db.query('SELECT 1');

  console.log('→ Aplicando esquema (database/schema.sql)...');
  const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  await db.query(schema);

  console.log(`→ Creando / actualizando admin ${email}...`);
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    `INSERT INTO usuarios (correo, password_hash, nombre, rol)
     VALUES ($1, $2, $3, 'admin')
     ON CONFLICT (correo) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email, hash, 'Administrador Hayya']
  );

  const ok = await bcrypt.compare(password, hash);
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM socios');

  console.log(`\n✅ Base lista. Socios: ${rows[0].n}. Verificación de hash: ${ok ? 'OK' : 'FALLÓ'}`);
  console.log(`   Login: ${email} / ${password}\n`);
}

main()
  .catch((err) => {
    console.error('\n❌ Error configurando la base:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
