/**
 * Migration: add period tracking columns.
 *   1. system_clock: add period_type, incident_posts_remaining
 *   2. dispatches: add period_type
 *
 * Usage: npm run db:migrate-period
 * Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
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
    if (msg.includes('already exists')) {
      console.log(`  ~ ${label} — skipped (already exists)`);
    } else {
      throw err;
    }
  }
}

async function main() {
  console.log('Step 1: system_clock — add period_type');
  await tryStep(
    'ADD COLUMN period_type',
    `ALTER TABLE system_clock ADD COLUMN IF NOT EXISTS period_type text NOT NULL DEFAULT 'standard'`
  );

  console.log('Step 2: system_clock — add incident_posts_remaining');
  await tryStep(
    'ADD COLUMN incident_posts_remaining',
    `ALTER TABLE system_clock ADD COLUMN IF NOT EXISTS incident_posts_remaining integer NOT NULL DEFAULT 0`
  );

  console.log('Step 3: dispatches — add period_type');
  await tryStep(
    'ADD COLUMN period_type to dispatches',
    `ALTER TABLE dispatches ADD COLUMN IF NOT EXISTS period_type text NOT NULL DEFAULT 'standard'`
  );

  console.log('\nMigration complete.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
