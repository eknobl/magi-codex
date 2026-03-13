import { db } from '@/db';
import { dispatches, magiStates, worldEvents } from '@/db/schema';
import { desc, eq, asc } from 'drizzle-orm';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// ── Year mapping ──────────────────────────────────────────────────────────────
// DB year 0 = narrative year 2039 (The OMEGA Pact)
const YEAR_BASE = 2039;
const toYear = (y: number) => y + YEAR_BASE;

// ── Month helpers ─────────────────────────────────────────────────────────────
const MONTH_ORDER: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4,
  May: 5, June: 6, July: 7, August: 8,
  September: 9, October: 10, November: 11, December: 12,
};

// ── MAGI colours ──────────────────────────────────────────────────────────────
const MAGI_COLOR: Record<string, string> = {
  PROMETHEUS: 'var(--prometheus)', APOLLO:  'var(--apollo)',
  BRIGID:     'var(--brigid)',     NUWA:    'var(--nuwa)',
  HERMES:     'var(--hermes)',     ATHENA:  'var(--athena)',
  SVAROG:     'var(--svarog)',     SURYA:   'var(--surya)',
  TYR:        'var(--tyr)',        TENGRI:  'var(--tengri)',
  THOTH:      'var(--thoth)',      NEZHA:   'var(--nezha)',
};

// ── Status indicators ────────────────────────────────────────────────────────
const STATUS_GLYPH: Record<string, string> = {
  resolved: '●', active: '◉', seeding: '◎', planned: '○',
};
const STATUS_COLOR: Record<string, string> = {
  resolved: 'var(--text-muted)',
  active:   'var(--apollo)',
  seeding:  'var(--hermes)',
  planned:  'var(--accent-dim)',
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
  }[];
}

export default async function DispatchesPage() {
  // ── Fetch dispatches ────────────────────────────────────────────────────────
  const dispatchRows = await db
    .select({
      id:             dispatches.id,
      magiId:         dispatches.magiId,
      domain:         magiStates.domain,
      fictionalYear:  dispatches.fictionalYear,
      fictionalMonth: dispatches.fictionalMonth,
      fictionalDay:   dispatches.fictionalDay,
      content:        dispatches.content,
      tokensUsed:     dispatches.tokensUsed,
      createdAt:      dispatches.createdAt,
    })
    .from(dispatches)
    .innerJoin(magiStates, eq(dispatches.magiId, magiStates.id))
    .orderBy(desc(dispatches.createdAt));

  // ── Group dispatches by fictional date ──────────────────────────────────────
  const dayMap = new Map<string, DayGroup>();
  for (const row of dispatchRows) {
    const key = `${row.fictionalYear}|${row.fictionalMonth}|${row.fictionalDay}`;
    if (!dayMap.has(key)) {
      dayMap.set(key, { year: row.fictionalYear, month: row.fictionalMonth, day: row.fictionalDay, entries: [] });
    }
    dayMap.get(key)!.entries.push({
      id: row.id, magiId: row.magiId, domain: row.domain,
      content: row.content, tokensUsed: row.tokensUsed,
    });
  }

  // Sort days newest first
  const days = Array.from(dayMap.values()).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    const mo = (MONTH_ORDER[b.month] ?? 0) - (MONTH_ORDER[a.month] ?? 0);
    if (mo !== 0) return mo;
    return b.day - a.day;
  });

  // ── Fetch world events ──────────────────────────────────────────────────────
  const events = await db
    .select()
    .from(worldEvents)
    .orderBy(
      asc(worldEvents.fictionalYear),
      asc(worldEvents.fictionalMonth),
      asc(worldEvents.fictionalDay)
    );

  return (
    <main style={{ maxWidth: '1600px', margin: '0 auto', padding: '2rem' }}>

      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '2rem',
      }}>
        <div>
          <Link href="/dashboard" className="navbar-link" style={{ marginRight: '1.5rem' }}>← DASHBOARD</Link>
          <span style={{ fontSize: '1.1rem', letterSpacing: '0.3em', color: 'var(--text-secondary)' }}>
            MAGI CODEX
          </span>
        </div>
        <Link href="/dashboard/timeline" className="navbar-link">MANAGE EVENTS →</Link>
      </header>

      {/* ── Two-panel layout ─────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2.5rem', alignItems: 'start' }}>

        {/* ══ LEFT COLUMN — TIMELINE ══════════════════════════════════════════ */}
        <aside style={{ position: 'sticky', top: '2rem' }}>
          <div style={{
            fontSize: '0.6rem', letterSpacing: '0.25em', color: 'var(--text-muted)',
            marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)',
          }}>
            TIMELINE
          </div>

          {/* Founding event — OMEGA Pact (hardcoded) */}
          <div style={{
            borderLeft: '2px solid var(--accent)', paddingLeft: '0.75rem',
            marginBottom: '1rem',
          }}>
            <div style={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '0.2rem' }}>
              ◆ {YEAR_BASE}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.2rem', letterSpacing: '0.05em' }}>
              The OMEGA Pact
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Signed in Geneva — twelve MAGI & 193 nations of Earth.
            </div>
          </div>

          {/* DB world events — sorted oldest first */}
          {events.map((ev) => (
            <div
              key={ev.id}
              style={{
                borderLeft: `2px solid ${ev.isMilestone ? 'var(--accent-dim)' : 'var(--border)'}`,
                paddingLeft: '0.75rem',
                marginBottom: '1rem',
                opacity: ev.status === 'resolved' ? 0.6 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.6rem', color: STATUS_COLOR[ev.status] ?? 'var(--text-muted)' }}>
                  {STATUS_GLYPH[ev.status] ?? '○'}
                </span>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
                  {toYear(ev.fictionalYear)} {ev.fictionalMonth.slice(0, 3).toUpperCase()}
                </span>
                {ev.isMilestone && (
                  <span style={{ fontSize: '0.55rem', color: 'var(--accent-dim)', letterSpacing: '0.1em' }}>◆</span>
                )}
              </div>
              <div style={{
                fontSize: ev.isMilestone ? '0.8rem' : '0.75rem',
                color: ev.isMilestone ? 'var(--text-primary)' : 'var(--text-secondary)',
                lineHeight: 1.4,
              }}>
                {ev.title}
              </div>
              {ev.affectedMagi && ev.affectedMagi.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.35rem' }}>
                  {ev.affectedMagi.map((id) => (
                    <span key={id} style={{
                      fontSize: '0.55rem', letterSpacing: '0.08em',
                      color: MAGI_COLOR[id] ?? 'var(--text-muted)',
                      border: `1px solid ${MAGI_COLOR[id] ?? 'var(--border)'}`,
                      padding: '0.05rem 0.3rem',
                    }}>
                      {id}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Footer link */}
          <div style={{ marginTop: '1.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <Link href="/dashboard/timeline" className="navbar-link" style={{ fontSize: '0.65rem' }}>
              + ADD EVENT →
            </Link>
          </div>
        </aside>

        {/* ══ RIGHT AREA — DISPATCHES (3-column grid) ═════════════════════════ */}
        <div>
          <div style={{
            fontSize: '0.6rem', letterSpacing: '0.25em', color: 'var(--text-muted)',
            marginBottom: '1.25rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>TRANSMISSIONS</span>
            <span>{dispatchRows.length} DISPATCH{dispatchRows.length !== 1 ? 'ES' : ''}</span>
          </div>

          {days.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              No transmissions yet. The cron fires daily at 12:00 Mexico City time.
            </p>
          )}

          {/* Day groups */}
          {days.map((day) => (
            <div key={`${day.year}|${day.month}|${day.day}`} style={{ marginBottom: '2.5rem' }}>

              {/* Day header — spans all 3 columns */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
              }}>
                <span style={{ fontSize: '0.6rem', letterSpacing: '0.2em', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {toYear(day.year)} — {day.month.toUpperCase()} {day.day}
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '0.55rem', color: 'var(--text-muted)', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {day.entries.length} TRANSMISSION{day.entries.length !== 1 ? 'S' : ''}
                </span>
              </div>

              {/* 3-column dispatch grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '0.75rem',
                alignItems: 'start',
              }}>
                {day.entries.map((entry) => {
                  const color = MAGI_COLOR[entry.magiId] ?? 'var(--accent)';
                  const isFull = (entry.tokensUsed ?? 0) > 300;
                  return (
                    <article
                      key={entry.id}
                      style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderTop: `2px solid ${color}`,
                        padding: '1rem',
                      }}
                    >
                      {/* Card header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: '0.6rem', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border)',
                      }}>
                        <Link
                          href={`/dashboard/${entry.magiId.toLowerCase()}`}
                          style={{ color, letterSpacing: '0.15em', fontSize: '0.8rem' }}
                        >
                          {entry.magiId}
                        </Link>
                        <span style={{
                          fontSize: '0.55rem', letterSpacing: '0.1em',
                          color: isFull ? 'var(--accent)' : 'var(--text-muted)',
                          border: `1px solid ${isFull ? 'var(--accent-dim)' : 'var(--border)'}`,
                          padding: '0.1rem 0.35rem',
                        }}>
                          {isFull ? 'FULL' : 'BRIEF'}
                        </span>
                      </div>

                      {/* Domain */}
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>
                        {entry.domain}
                      </div>

                      {/* Content */}
                      <p style={{
                        fontSize: '0.78rem', lineHeight: '1.75',
                        color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', margin: 0,
                      }}>
                        {entry.content}
                      </p>

                      {/* Token count */}
                      {entry.tokensUsed && (
                        <div style={{ marginTop: '0.6rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                          {entry.tokensUsed} tokens
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
