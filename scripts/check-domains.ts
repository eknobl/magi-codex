import { config } from 'dotenv';
config({ path: '.env.local' });
import { db } from '../src/db';
import { magiStates } from '../src/db/schema';
import { sql, asc } from 'drizzle-orm';

async function main() {
  const rows = await db
    .select({
      id: magiStates.id,
      domainCol: magiStates.domain,
      domainJson: sql<string>`state->>'domain'`,
    })
    .from(magiStates)
    .orderBy(asc(magiStates.id));

  console.log('ID         | domain col                          | state.domain');
  console.log('-----------|-------------------------------------|-------------------------------------');
  rows.forEach(r =>
    console.log(r.id.padEnd(10), '|', (r.domainCol ?? '').padEnd(35), '|', r.domainJson)
  );
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
