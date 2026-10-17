/**
 * Aplica, en orden, todos los archivos de database/migrations/*.sql.
 * Las migraciones son idempotentes, así que se puede correr varias veces.
 * A diferencia de `db:setup`, NO toca el usuario administrador.
 *
 * Uso:  npm run db:migrate
 */
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function main() {
  const dir = path.join(__dirname, '..', 'database', 'migrations');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();

  console.log('→ Conectando a PostgreSQL...');
  await db.query('SELECT 1');

  for (const file of files) {
    console.log(`→ Aplicando ${file}...`);
    await db.query(fs.readFileSync(path.join(dir, file), 'utf8'));
  }

  console.log(`\n✅ ${files.length} migración(es) aplicada(s).\n`);
}

main()
  .catch((err) => {
    console.error('\n❌ Error aplicando migraciones:', err.message);
    process.exitCode = 1;
  })
  .finally(() => db.pool.end());
