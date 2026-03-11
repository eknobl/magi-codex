import { db } from '@/db';
import { dispatches, magiStates } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const MONTH_ORDER: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
};

// Colour token per MAGI (matches CSS vars)
const MAGI_COLOR: Record<string, string> = {
  PROMETHEUS: 'var(--prometheus)',
  APOLLO:     'var(--apollo)',
  BRIGID:     'var(--brigid)',
  NUWA:       'var(--nuwa)',
  HERMES:     'var(--hermes)',
  ATHENA:     'var(--athena)',
  SVAROG:     'var(--svarog)',
  SURYA:      'var(--surya)',
  TYR:        'var(--tyr)',
  TENGRI:     'var(--tengri)',
  THOTH:      'var(--thoth)',
  NEZHA:      'var(--nezha)',
};

interface DayGroup {
  year: number;
  month: string;
  day: number;
  entries: {
    id: string;
    magiId: string;
    domain: string;
    content: string;
    tokensUsed: number | null;
    createdAt: Date;
  }[];
}

export default async function DispatchesPage() {
  // Fetch all dispatches newest-first, joined with magiStates for domain
  const rows = await db
    .select({
      id:         dispatches.id,
      magiId:     dispatches.magiId,
      domain:     magiStates.domain,
      fictionalYear:  dispatches.fictionalYear,
      fictionalMonth: dispatches.fictionalMonth,
      fictionalDay:   dispatches.fictionalDay,
      content:    dispatches.content,
      tokensUsed: dispatches.tokensUsed,
      createdAt:  dispatches.createdAt,
    })
    .from(dispatches)
    .innerJoin(magiStates, eq(dispatches.magiId, magiStates.id))
    .orderBy(desc(dispatches.createdAt));

  // Group by fictional date
  const dayMap = new Map<string, DayGroup>();
  for (const row of rows) {
    const key = `${row.fictionalYear}|${row.fictionalMonth}|${row.fictionalDay}`;
    if (!dayMap.has(key)) {
      dayMap.set(key, {
        year:  row.fictionalYear,
        month: row.fictionalMonth,
        day:   row.fictionalDay,
        entries: [],
      });
    }
    dayMap.get(key)!.entries.push({
      id:         row.id,
      magiId:     row.magiId,
      domain:     row.domain,
      content:    row.content,
      tokensUsed: row.tokensUsed,
      createdAt:  row.createdAt,
    });
  }

  // Sort day groups: newest first (year DESC → month DESC → day DESC)
  const days = Array.from(dayMap.values()).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const mo = (MONTH_ORDER[b.month] ?? 0) - (MONTH_ORDER[a.month] ?? 0);
    if (mo !== 0) return mo;
    return b.day - a.day;
  });

  return (
    <main style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <Link href="/dashboard" className="navbar-link">← DASHBOARD</Link>
          <Link href="/dashboard/timeline" className="navbar-link">TIMELINE →</Link>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'normal', letterSpacing: '0.3em', color: 'var(--text-secondary)', margin: '0 0 0.25rem' }}>
          MAGI CODEX
        </h1>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
          TRANSMISSION LOG — {rows.length} DISPATCH{rows.length !== 1 ? 'ES' : ''} ACROSS {days.length} DAY{days.length !== 1 ? 'S' : ''}
        </span>
      </header>

      {days.length === 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
          No dispatches yet. Run the cron or trigger a manual dispatch to begin.
        </p>
      )}

      {/* Day groups */}
      {days.map((day) => (
        <section key={`${day.year}|${day.month}|${day.day}`} style={{ marginBottom: '3rem' }}>
          {/* Day header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}>
            <span style={{
              fontSize: '0.65rem',
              letterSpacing: '0.25em',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
            }}>
              YEAR {day.year} — {day.month.toUpperCase()} {day.day}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>
              {day.entries.length} TRANSMISSION{day.entries.length !== 1 ? 'S' : ''}
            </span>
          </div>

          {/* Dispatch cards for this day */}
          {day.entries.map((entry) => {
            const color = MAGI_COLOR[entry.magiId] ?? 'var(--accent)';
            const isLong = (entry.tokensUsed ?? 0) > 300;
            return (
              <article
                key={entry.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderLeft: `3px solid ${color}`,
                  marginBottom: '1rem',
                  padding: '1.25rem',
                }}
              >
                {/* Card header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Link
                      href={`/dashboard/${entry.magiId.toLowerCase()}`}
                      style={{ color, letterSpacing: '0.15em', fontSize: '0.9rem', fontWeight: 'normal' }}
                    >
                      {entry.magiId}
                    </Link>
                    <span style={{
                      fontSize: '0.6rem',
                      letterSpacing: '0.1em',
                      color: isLong ? 'var(--accent)' : 'var(--text-muted)',
                      border: `1px solid ${isLong ? 'var(--accent-dim)' : 'var(--border)'}`,
                      padding: '0.1rem 0.4rem',
                    }}>
                      {isLong ? 'FULL' : 'BRIEF'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
                    {entry.domain}
                  </span>
                </div>

                {/* Dispatch content */}
                <p style={{
                  fontSize: '0.82rem',
                  lineHeight: '1.8',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                }}>
                  {entry.content}
                </p>

                {/* Footer */}
                {entry.tokensUsed && (
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {entry.tokensUsed} tokens
                  </div>
                )}
              </article>
            );
          })}
        </section>
      ))}
    </main>
  );
}
