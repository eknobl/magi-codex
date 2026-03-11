import { db } from '@/db';
import { magiStates } from '@/db/schema';
import type { MagiState } from '@/types/magi';
import MagiCard from '@/components/MagiCard';
import Link from 'next/link';

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ margin: 0 }}>MAGI CODEX</h1>
          <nav style={{ display: 'flex', gap: '1.5rem' }}>
            <Link href="/dashboard/dispatches" className="navbar-link">TRANSMISSIONS</Link>
            <Link href="/dashboard/timeline" className="navbar-link">TIMELINE</Link>
          </nav>
        </div>
        <span className="dashboard-subtitle" style={{ marginTop: '0.25rem', display: 'block' }}>
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
