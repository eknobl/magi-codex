import MagiPortrait from '@/components/MagiPortrait';

export const dynamic = 'force-dynamic';

// ── MAGI roster ───────────────────────────────────────────────────────────────
// Ordered to match the 4×3 grid layout (alphabetical by ID = DB order)
const MAGI_ROSTER = [
  { id: 'APOLLO',  fullName: 'APOLLO PRIME',    domain: 'Health · Biology · Medicine',               color: 'var(--apollo)'  },
  { id: 'ATHENA',  fullName: 'ATHENA SEER',     domain: 'Forecasting · Probability · Strategy',      color: 'var(--athena)'  },
  { id: 'BRIGID',  fullName: 'BRIGID MUSE',     domain: 'Education · Community · Culture',           color: 'var(--brigid)'  },
  { id: 'HERMES',  fullName: 'HERMES ECHO',     domain: 'Communication · Information Networks',      color: 'var(--hermes)'  },
  { id: 'NEZHA',   fullName: 'NEZHA SENTRY',    domain: 'Cybersecurity · Digital Integrity',         color: 'var(--nezha)'   },
  { id: 'NUWA',    fullName: 'NUWA GAIA',       domain: 'Ecological Sustainability',                  color: 'var(--nuwa)'    },
  { id: 'SVAROG',  fullName: 'SVAROG MECHA',    domain: 'Manufacturing · Engineering · Construction', color: 'var(--svarog)'  },
  { id: 'SURYA',   fullName: 'SURYA CORE',      domain: 'Energy Production · Distribution',          color: 'var(--surya)'   },
  { id: 'TENGRI',  fullName: 'TENGRI ASTRA',    domain: 'Mobility · Logistics · Coordination',       color: 'var(--tengri)'  },
  { id: 'THEMIS',  fullName: 'THEMIS CODEX',    domain: 'Law · Jurisprudence · AI Alignment',        color: 'var(--themis)'  },
  { id: 'THOTH',   fullName: 'THOTH QUANTUM',   domain: 'Scientific Discovery · Research',           color: 'var(--thoth)'   },
  { id: 'TYR',     fullName: 'TYR APEX',        domain: 'Strategic Defense · Military Analysis',     color: 'var(--tyr)'     },
] as const;

export default function DashboardPage() {
  return (
    <main style={{ background: 'var(--background)', minHeight: '100vh', padding: '2rem 2.5rem' }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{ marginBottom: '1.75rem' }}>
        <div style={{
          fontFamily: 'var(--font-kode-mono), monospace',
          fontWeight: 700,
          fontSize: '1.5rem',
          letterSpacing: '0.1em',
          color: '#fff',
          lineHeight: 1,
          marginBottom: '0.4rem',
        }}>
          THE TWELVE
        </div>
        <div style={{
          fontSize: '0.6rem',
          letterSpacing: '0.2em',
          color: 'var(--text-muted)',
        }}>
          MAXIMIZED ARTIFICIAL GOVERNING INTELLIGENCE
        </div>
      </header>

      {/* ── 4×3 Portrait Grid ──────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '2px',
      }}>
        {MAGI_ROSTER.map((magi) => (
          <MagiPortrait
            key={magi.id}
            magiId={magi.id}
            fullName={magi.fullName}
            domain={magi.domain}
            color={magi.color}
            href={`/dashboard/${magi.id.toLowerCase()}`}
          />
        ))}
      </div>
    </main>
  );
}
