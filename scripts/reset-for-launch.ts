/**
 * Reset script — prepare for narrative launch.
 *   1. Delete all existing dispatch records
 *   2. Reset system clock to Year 0, March 4 (the OMEGA COVENANT date)
 *
 * The next cron run will fire on March 4, find THE OMEGA COVENANT event,
 * and generate the first dispatches as a reaction to it.
 *
 * Usage: npm run db:reset-launch
 */

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { db } from '../src/db';
import { dispatches, systemClock } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

async function main() {
  console.log('Step 1: Delete all dispatches...');
  const deleted = await db.delete(dispatches).returning({ id: dispatches.id });
  console.log(`  ✓ Deleted ${deleted.length} dispatch records`);

  console.log('Step 2: Reset system clock to Year 0, March 4...');
  await db
    .update(systemClock)
    .set({ fictionalYear: 0, fictionalMonth: 'March', fictionalDay: 4 })
    .where(eq(systemClock.id, 1));
  console.log('  ✓ Clock set to Year 0 (2039), March 4');

  console.log('\nReady. The next cron run will generate dispatches reacting to THE OMEGA COVENANT.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Reset failed:', err);
  process.exit(1);
});
