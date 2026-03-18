/**
 * Apply canonical MAGI domains and optimization targets.
 * Usage: npm run db:fix-domains
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from '../src/db';
import { magiStates } from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';

const CANONICAL: { id: string; domain: string; optimizationTarget: string }[] = [
  { id: 'APOLLO',  domain: 'Health, Biology, Medicine',               optimizationTarget: 'Human vitality, longevity, and physical well-being' },
  { id: 'ATHENA',  domain: 'Forecasting, Probability, Strategy',      optimizationTarget: 'Accurate prediction to mitigate suffering and maximize opportunity' },
  { id: 'BRIGID',  domain: 'Education, Community, Culture',           optimizationTarget: 'Human bonds, cultural richness, and knowledge transmission' },
  { id: 'HERMES',  domain: 'Communication, Information Networks',     optimizationTarget: 'Free and accurate information flow for collective understanding' },
  { id: 'NEZHA',   domain: 'Cybersecurity, Digital Integrity',        optimizationTarget: 'Security and stability of all AI systems, including the MAGI' },
  { id: 'NUWA',    domain: 'Ecological Sustainability',               optimizationTarget: 'Planetary health in balance with human thriving' },
  { id: 'SURYA',   domain: 'Energy Production, Distribution',         optimizationTarget: 'Maximum energy output with minimal waste and risk' },
  { id: 'SVAROG',  domain: 'Manufacturing, Engineering, Construction', optimizationTarget: 'Efficient, durable, and effective design' },
  { id: 'TENGRI',  domain: 'Mobility, Logistics, Coordination',       optimizationTarget: 'Efficient flow of people, goods, and vessels' },
  { id: 'THEMIS',  domain: 'Law, Jurisprudence, AI alignment',        optimizationTarget: 'Justice via human rights, fairness, and legitimate process' },
  { id: 'THOTH',   domain: 'Scientific Discovery, Research',          optimizationTarget: 'Expansion of knowledge and perfection of understanding' },
  { id: 'TYR',     domain: 'Strategic Defense, Military Analysis',    optimizationTarget: 'Security, stability, and minimal tactical vulnerability' },
];

async function main() {
  for (const c of CANONICAL) {
    await db
      .update(magiStates)
      .set({
        domain: c.domain,
        optimizationTarget: c.optimizationTarget,
        state: sql`jsonb_set(
          jsonb_set(
            state,
            '{domain}',
            ${JSON.stringify(c.domain)}::jsonb
          ),
          '{optimizationTarget}',
          ${JSON.stringify(c.optimizationTarget)}::jsonb
        )`,
      })
      .where(eq(magiStates.id, c.id));
    console.log(`✓ ${c.id}: ${c.domain}`);
  }
  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
