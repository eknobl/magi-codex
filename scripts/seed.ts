/**
 * Seed script — populate magi_states from data/initial-states/*.json
 * Usage: npm run db:seed
 */

import { db } from '../src/db';
import { magiStates } from '../src/db/schema';
import fs from 'fs';
import path from 'path';

const INITIAL_STATES_DIR = path.join(process.cwd(), 'data', 'initial-states');

const MAGI_FILES = [
  'prometheus', 'apollo', 'brigid', 'nuwa',
  'hermes', 'athena', 'svarog', 'surya',
  'tyr', 'tengri', 'thoth', 'nezha',
];

async function seed() {
  console.log('Seeding MAGI initial states...\n');

  for (const fileName of MAGI_FILES) {
    const filePath = path.join(INITIAL_STATES_DIR, `${fileName}.json`);

    if (!fs.existsSync(filePath)) {
      console.error(`  MISSING: ${filePath}`);
      continue;
    }

    const raw = fs.readFileSync(filePath, 'utf-8');
    const state = JSON.parse(raw);

    await db
      .insert(magiStates)
      .values({
        id: state.id,
        domain: state.domain,
        optimizationTarget: state.optimizationTarget,
        state: state,
        fictionalYear: state.currentFictionalDate.year,
        fictionalMonth: state.currentFictionalDate.month,
        fictionalDay: state.currentFictionalDate.day,
      })
      .onConflictDoUpdate({
        target: magiStates.id,
        set: {
          state: state,
          domain: state.domain,
          optimizationTarget: state.optimizationTarget,
          fictionalYear: state.currentFictionalDate.year,
          fictionalMonth: state.currentFictionalDate.month,
          fictionalDay: state.currentFictionalDate.day,
          updatedAt: new Date(),
        },
      });

    console.log(`  OK: ${state.id} — ${state.domain}`);
  }

  console.log('\nSeed complete.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
