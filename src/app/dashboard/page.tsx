import { db } from '@/db';
import { magiStates } from '@/db/schema';
import type { MagiState } from '@/types/magi';
import MagiCard from '@/components/MagiCard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  let rows: typeof magiStates.$inferSelect[] = [];
  let error: string | null = null;

  try {
    rows = await db.select().from(magiStates).orderBy(magiStates.id);
  } catch (e) {
    error = 'Database not connected. Run: npm run db:push && npm run db:seed';
  }

  return (
    <main className="dashboard-grid">
      <header className="dashboard-header">
        <h1>MAGI CODEX</h1>
        <span className="dashboard-subtitle">
          AUTHOR DASHBOARD — {rows.length > 0 ? `${rows.length} MAGI ONLINE` : 'OFFLINE'}
        </span>
      </header>

      {error && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '2rem', fontStyle: 'italic' }}>
          {error}
        </div>
      )}

      <div className="magi-grid">
        {rows.map((row) => (
          <MagiCard
            key={row.id}
            magiId={row.id}
            domain={row.domain}
            state={row.state as MagiState}
            fictionalDate={{
              year: row.fictionalYear,
              month: row.fictionalMonth,
              day: row.fictionalDay,
            }}
          />
        ))}
      </div>
    </main>
  );
}
