/**
 * Migration: rename MAGI id PROMETHEUS → THEMIS in the database.
 *
 * Because magi_states.id is a PK referenced by dispatches.magi_id and
 * evolution_log.magi_id as FKs, we:
 *   1. Insert a new THEMIS row (copying PROMETHEUS data)
 *   2. Update dispatches, evolution_log FK references
 *   3. Update relationship_snapshots text columns (magi_a, magi_b)
 *   4. Delete the old PROMETHEUS row
 *
 * Safe to run only once; re-running after PROMETHEUS is gone is a no-op.
 * Usage: npm run db:migrate-prometheus-themis
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { db } from '../src/db';
import { magiStates, dispatches, evolutionLog, relationshipSnapshots } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  // 1. Check if PROMETHEUS still exists
  const [prometheus] = await db.select().from(magiStates).where(eq(magiStates.id, 'PROMETHEUS'));
  if (!prometheus) {
    console.log('PROMETHEUS row not found — already migrated or never seeded.');
    process.exit(0);
  }

  // 2. Insert THEMIS row with same data
  const [existing] = await db.select().from(magiStates).where(eq(magiStates.id, 'THEMIS'));
  if (!existing) {
    await db.insert(magiStates).values({
      id: 'THEMIS',
      domain: prometheus.domain,
      optimizationTarget: prometheus.optimizationTarget,
      state: prometheus.state,
      fictionalYear: prometheus.fictionalYear,
      fictionalMonth: prometheus.fictionalMonth,
      fictionalDay: prometheus.fictionalDay,
      updatedAt: prometheus.updatedAt,
      createdAt: prometheus.createdAt,
    });
    console.log('✓ Inserted THEMIS row');
  } else {
    console.log('· THEMIS row already exists, skipping insert');
  }

  // 3. Re-point dispatches FK
  await db
    .update(dispatches)
    .set({ magiId: 'THEMIS' })
    .where(eq(dispatches.magiId, 'PROMETHEUS'));
  console.log('✓ Updated dispatch rows');

  // 4. Re-point evolution_log FK
  await db
    .update(evolutionLog)
    .set({ magiId: 'THEMIS' })
    .where(eq(evolutionLog.magiId, 'PROMETHEUS'));
  console.log('✓ Updated evolution_log rows');

  // 5. Update relationship_snapshots text columns
  await db.execute(sql`UPDATE relationship_snapshots SET magi_a = 'THEMIS' WHERE magi_a = 'PROMETHEUS'`);
  await db.execute(sql`UPDATE relationship_snapshots SET magi_b = 'THEMIS' WHERE magi_b = 'PROMETHEUS'`);
  console.log('✓ Updated relationship_snapshots');

  // 6. Delete the old PROMETHEUS row
  await db.delete(magiStates).where(eq(magiStates.id, 'PROMETHEUS'));
  console.log('✓ Deleted PROMETHEUS row');

  console.log('\nDone. PROMETHEUS has been renamed to THEMIS in the database.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
