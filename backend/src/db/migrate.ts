import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { closePool, getPool, hasDatabase, withClient } from './pool.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function migrationsDir(): string {
  return process.env.MIGRATIONS_DIR?.trim() || join(__dirname, '..', '..', 'migrations');
}

async function ensureMigrationsTable(): Promise<void> {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function appliedMigrations(): Promise<Set<string>> {
  const result = await getPool().query<{ id: string }>('SELECT id FROM schema_migrations ORDER BY id');
  return new Set(result.rows.map((row) => row.id));
}

export async function runMigrations(): Promise<{ applied: string[] }> {
  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is required to run migrations');
  }

  await ensureMigrationsTable();
  const applied = await appliedMigrations();
  const dir = migrationsDir();
  const files = (await readdir(dir))
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const newlyApplied: string[] = [];

  for (const file of files) {
    if (applied.has(file)) {
      continue;
    }

    const sql = await readFile(join(dir, file), 'utf8');
    await withClient(async (client) => {
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [file]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    });

    newlyApplied.push(file);
  }

  return { applied: newlyApplied };
}

async function main() {
  try {
    const result = await runMigrations();
    if (result.applied.length === 0) {
      console.log('Migrations: already up to date.');
    } else {
      console.log(`Migrations applied: ${result.applied.join(', ')}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown migration error';
    console.error(`Migration failed: ${message}`);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
}

const isDirectRun =
  process.argv[1]?.includes('migrate') ||
  process.argv[1]?.endsWith('migrate.js') ||
  process.argv[1]?.endsWith('migrate.ts');

if (isDirectRun) {
  void main();
}
