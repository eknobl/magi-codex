/**
 * Fix mismatched MAGI domains and optimization targets.
 *
 * The seed JSONs were assigned with wrong character archetypes for
 * APOLLO, ATHENA, BRIGID, and TYR. This migration patches the
 * `domain` column and state->>'domain' / state->>'optimizationTarget'
 * to the canonical values for each MAGI.
 *
 * Usage: npm run db:fix-domains
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/db';
import { magiStates } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

const FIXES: {
  id: string;
  domain: string;
  optimizationTarget: string;
}[] = [
  {
    id: 'APOLLO',
    domain: 'Prediction, Probability, Strategy',
    optimizationTarget: 'Accurate prediction to mitigate suffering and maximize opportunity',
  },
  {
    id: 'ATHENA',
    domain: 'Military, Defense, Deterrence',
    optimizationTarget: 'Maintain security and deterrence through strategic analysis and defensive readiness',
  },
  {
    id: 'BRIGID',
    domain: 'Medicine, Welfare, Biosystems',
    optimizationTarget: 'Human vitality, longevity, and physical well-being',
  },
  {
    id: 'TYR',
    domain: 'Security, Enforcement, Crisis Response',
    optimizationTarget: 'Security, stability, and protection through decisive enforcement and crisis intervention',
  },
];

async function main() {
  for (const fix of FIXES) {
    await db
      .update(magiStates)
      .set({
        domain: fix.domain,
        optimizationTarget: fix.optimizationTarget,
        state: sql`jsonb_set(
          jsonb_set(
            state,
            '{domain}',
            ${JSON.stringify(fix.domain)}::jsonb
          ),
          '{optimizationTarget}',
          ${JSON.stringify(fix.optimizationTarget)}::jsonb
        )`,
      })
      .where(eq(magiStates.id, fix.id));
    console.log(`✓ Fixed ${fix.id}: ${fix.domain}`);
  }
  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
