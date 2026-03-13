/**
 * Migration: update world_events schema
 *   1. Convert event_type (text) → event_type (text[])
 *   2. Add significance (text) column, migrate from is_milestone boolean
 *   3. Drop is_milestone column
 *
 * Usage: npm run db:migrate-events
 * Safe to run multiple times (wrapped in try/catch for each step).
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function tryStep(label: string, query: string) {
  try {
    await db.execute(sql.raw(query));
    console.log(`  ✓ ${label}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Ignore "already exists" / "does not exist" / "cannot cast" idempotency errors
    if (
      msg.includes('already exists') ||
      msg.includes('does not exist') ||
      msg.includes('cannot be cast') ||
      msg.includes('42804') // Postgres: cannot alter to incompatible type (already array)
    ) {
      console.log(`  ~ ${label} — skipped (${msg.split('\n')[0]})`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log('Step 1: Convert event_type text → text[]');
  await tryStep(
    'ALTER event_type to text[]',
    `ALTER TABLE world_events ALTER COLUMN event_type TYPE text[] USING ARRAY[event_type]`
  );

  console.log('Step 2: Add significance column');
  await tryStep(
    'ADD COLUMN significance',
    `ALTER TABLE world_events ADD COLUMN significance text NOT NULL DEFAULT 'standard'`
  );

  console.log('Step 3: Migrate is_milestone → significance = milestone');
  await tryStep(
    'UPDATE significance from is_milestone',
    `UPDATE world_events SET significance = 'milestone' WHERE is_milestone = true AND significance = 'standard'`
  );

  console.log('Step 4: Drop is_milestone column');
  await tryStep(
    'DROP COLUMN is_milestone',
    `ALTER TABLE world_events DROP COLUMN IF EXISTS is_milestone`
  );

  console.log('\nMigration complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
