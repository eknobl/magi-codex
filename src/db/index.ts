import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Lazy singleton — defers connection until first query so the dashboard
// can render a setup message when DATABASE_URL is not yet configured.
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDb | undefined;

function createDb(): DrizzleDb {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL or POSTGRES_URL is not set. Copy .env.example to .env.local and add your database URL.'
    );
  }
  const client = postgres(connectionString, { ssl: 'require' });
  return drizzle(client, { schema });
}

export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop) {
    if (!_db) _db = createDb();
    const value = (_db as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? (value as Function).bind(_db) : value;
  },
});
