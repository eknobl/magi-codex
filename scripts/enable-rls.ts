/**
 * Security: enable Row Level Security on all public tables.
 *
 * Supabase exposes tables via PostgREST. Without RLS, anyone with the
 * public anon key can read/write all rows. Enabling RLS with no policies
 * blocks all PostgREST access (deny by default) while leaving direct
 * Postgres connections (Drizzle via DATABASE_URL) completely unaffected —
 * direct connections run as the DB owner and bypass RLS.
 *
 * Usage: npm run db:enable-rls
 * Safe to run multiple times (IF NOT ALREADY ENABLED is not a thing, but
 * ALTER TABLE ... ENABLE ROW LEVEL SECURITY is idempotent).
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

const TABLES = [
  'dispatches',
  'evolution_log',
  'magi_states',
  'relationship_snapshots',
  'system_clock',
  'world_events',
];

async function main() {
  for (const table of TABLES) {
    await db.execute(sql.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`));
    console.log(`✓ RLS enabled on ${table}`);
  }
  console.log('\nDone. PostgREST access is now blocked for all tables.');
  console.log('Drizzle (server-side) queries are unaffected.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
