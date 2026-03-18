import MagiPortrait from '@/components/MagiPortrait';

export const dynamic = 'force-dynamic';

// ── MAGI roster ───────────────────────────────────────────────────────────────
// Ordered to match the 4×3 grid layout (alphabetical by ID = DB order)
const MAGI_ROSTER = [
  { id: 'APOLLO',  fullName: 'APOLLO PRIME',    domain: 'Prediction · Risk · Strategy',              color: 'var(--apollo)'  },
  { id: 'ATHENA',  fullName: 'ATHENA SEER',     domain: 'Military · Defense · Deterrence',           color: 'var(--athena)'  },
  { id: 'BRIGID',  fullName: 'BRIGID MOTHER',   domain: 'Medicine · Welfare · Biosystems',           color: 'var(--brigid)'  },
  { id: 'HERMES',  fullName: 'HERMES ECHO',     domain: 'Communication · Information Networks',      color: 'var(--hermes)'  },
  { id: 'NEZHA',   fullName: 'NEZHA SENTRY',    domain: 'Digital Systems · Cybersecurity',           color: 'var(--nezha)'   },
  { id: 'NUWA',    fullName: 'NUWA GAIA',        domain: 'Ecology · Sustainability · Growth',         color: 'var(--nuwa)'    },
  { id: 'SVAROG',  fullName: 'SVAROG MECHA',    domain: 'Infrastructure · Manufacturing',            color: 'var(--svarog)'  },
  { id: 'SURYA',   fullName: 'SURYA CORE',      domain: 'Energy · Climate · Resource Allocation',    color: 'var(--surya)'   },
  { id: 'TENGRI',  fullName: 'TENGRI ASTRA',    domain: 'Mobility · Logistics · Coordination',       color: 'var(--tengri)'  },
  { id: 'THEMIS',  fullName: 'THEMIS CODEX',    domain: 'Law · Ethics · Jurisprudence',              color: 'var(--themis)'  },
  { id: 'THOTH',   fullName: 'THOTH HORIZON',   domain: 'Scientific Discovery · Research',           color: 'var(--thoth)'   },
  { id: 'TYR',     fullName: 'TYR APEX',        domain: 'Security · Enforcement · Crisis Response',  color: 'var(--tyr)'     },
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
