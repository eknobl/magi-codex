import { db } from '@/db';
import { worldEvents } from '@/db/schema';
import { asc } from 'drizzle-orm';
import HeroCarousel from '@/components/HeroCarousel';
import { YEAR_BASE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

// ── Date helpers ──────────────────────────────────────────────────────────────
const MONTH_DAYS: Record<string, number> = {
  January: 0, February: 31, March: 59, April: 90,
  May: 120, June: 151, July: 181, August: 212,
  September: 243, October: 273, November: 304, December: 334,
};

function toOrdinal(year: number, month: string, day: number): number {
  return year * 365 + (MONTH_DAYS[month] ?? 0) + day;
}

// ── Significance markers ──────────────────────────────────────────────────────
const SIG_GLYPH: Record<string, string> = {
  standard: '○', notable: '◇', milestone: '◆', epochal: '◈',
};
const SIG_COLOR: Record<string, string> = {
  standard: 'rgba(232,232,232,0.35)',
  notable:  'rgba(232,232,232,0.6)',
  milestone: 'rgba(232,232,232,0.9)',
  epochal:  '#ff0000',
};
const SIG_SIZE: Record<string, string> = {
  standard: '0.75rem', notable: '0.9rem', milestone: '1rem', epochal: '1.15rem',
};

export default async function HomePage() {
  const allEvents = await db
    .select()
    .from(worldEvents)
    .orderBy(asc(worldEvents.fictionalYear), asc(worldEvents.fictionalMonth), asc(worldEvents.fictionalDay));

  // ── Select top 7 events by significance, then chronologically ────────────────
  const SIG_RANK: Record<string, number> = { epochal: 0, milestone: 1, notable: 2, standard: 3 };
  const events = [...allEvents]
    .sort((a, b) => {
      const rankDiff = (SIG_RANK[a.significance ?? 'standard'] ?? 3) - (SIG_RANK[b.significance ?? 'standard'] ?? 3);
      if (rankDiff !== 0) return rankDiff;
      // Within same tier: most recent first
      return toOrdinal(b.fictionalYear, b.fictionalMonth, b.fictionalDay)
           - toOrdinal(a.fictionalYear, a.fictionalMonth, a.fictionalDay);
    })
    .slice(0, 7)
    .sort((a, b) => toOrdinal(a.fictionalYear, a.fictionalMonth, a.fictionalDay)
                  - toOrdinal(b.fictionalYear, b.fictionalMonth, b.fictionalDay));

  // ── Timeline positioning ────────────────────────────────────────────────────
  const ordinals = events.map((e) => toOrdinal(e.fictionalYear, e.fictionalMonth, e.fictionalDay));
  const minOrd = ordinals.length > 0 ? Math.min(...ordinals) : 0;
  const maxOrd = ordinals.length > 1 ? Math.max(...ordinals) : minOrd + 1;
  const range = maxOrd - minOrd || 1;

  // When there's only 1 event, center it; with few events give padding
  const PAD = 0.08; // 8% padding each side
  function pct(ord: number): string {
    if (ordinals.length === 1) return '50%';
    return `${PAD * 100 + ((ord - minOrd) / range) * (1 - PAD * 2) * 100}%`;
  }

  return (
    <main style={{ background: 'var(--background)', minHeight: '100vh' }}>

      {/* ── HERO SECTION ────────────────────────────────────────────────────── */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: '1fr 3fr',
        height: 'calc(100vh - 46px)',
        overflow: 'hidden',
      }}>

        {/* Left column — title */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '3rem 2rem 3rem 2.5rem',
          borderRight: '1px solid var(--border)',
          background: 'var(--background)',
          zIndex: 1,
        }}>
          <div style={{
            fontFamily: 'var(--font-kode-mono), monospace',
            fontWeight: 700,
            lineHeight: 0.9,
            letterSpacing: '-0.02em',
            color: '#fff',
            marginBottom: '2rem',
          }}>
            <div style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}>THE</div>
            <div style={{ fontSize: 'clamp(2.5rem, 5vw, 5rem)' }}>TWELVE</div>
          </div>

          <div style={{
            fontSize: '0.65rem',
            letterSpacing: '0.18em',
            color: 'var(--text-muted)',
            lineHeight: 2,
          }}>
            MAXIMIZED<br />
            ARTIFICIAL<br />
            GOVERNING<br />
            INTELLIGENCE
          </div>
        </div>

        {/* Right 3 columns — hero carousel */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <HeroCarousel images={['/magi/hero-1.png', '/magi/hero-2.png']} intervalMs={6000} />
          {/* Gradient fade on left edge to blend into title column */}
          <div style={{
            position: 'absolute',
            left: 0, top: 0, bottom: 0,
            width: '60px',
            background: 'linear-gradient(to right, var(--background), transparent)',
            zIndex: 1,
            pointerEvents: 'none',
          }} />
        </div>
      </section>

      {/* ── TIMELINE SECTION ────────────────────────────────────────────────── */}
      <section style={{
        padding: '2.5rem 2.5rem 3rem',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{
          fontSize: '0.55rem',
          letterSpacing: '0.25em',
          color: 'var(--text-muted)',
          marginBottom: '2rem',
        }}>
          TIMELINE
        </div>

        {events.length === 0 ? (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
            No events recorded yet.
          </p>
        ) : (
          <div style={{ position: 'relative', height: '90px' }}>
            {/* Horizontal rule */}
            <div style={{
              position: 'absolute',
              top: '38px',
              left: 0, right: 0,
              height: '1px',
              background: 'var(--border)',
            }} />

            {/* Event markers */}
            {events.map((ev, i) => {
              const sig = ev.significance ?? 'standard';
              const color = SIG_COLOR[sig] ?? 'var(--text-muted)';
              const glyph = SIG_GLYPH[sig] ?? '○';
              const size = SIG_SIZE[sig] ?? '0.75rem';
              const left = pct(ordinals[i]);
              const narrativeYear = ev.fictionalYear + YEAR_BASE;
              const shortMonth = ev.fictionalMonth.slice(0, 3).toUpperCase();

              return (
                <a
                  key={ev.id}
                  href="/dashboard/dispatches"
                  title={ev.description ?? ''}
                  style={{
                    position: 'absolute',
                    left,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    opacity: 0.85,
                  }}
                >
                  {/* Date label above line */}
                  <div style={{
                    fontSize: '0.5rem',
                    letterSpacing: '0.1em',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    marginBottom: '4px',
                  }}>
                    {narrativeYear} {shortMonth}
                  </div>

                  {/* Diamond marker on the line */}
                  <div style={{ fontSize: size, color, lineHeight: 1 }}>
                    {glyph}
                  </div>

                  {/* Title label below line */}
                  <div style={{
                    fontSize: '0.5rem',
                    letterSpacing: '0.06em',
                    color: sig === 'epochal' ? '#ff0000' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    marginTop: '4px',
                    fontWeight: sig === 'epochal' ? 600 : 400,
                    maxWidth: '120px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                  }}>
                    {ev.title}
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}
