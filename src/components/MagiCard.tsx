import Link from 'next/link';
import type { MagiState, FictionalDate } from '@/types/magi';

interface Props {
  magiId: string;
  domain: string;
  state: MagiState;
  fictionalDate: FictionalDate;
}

const DOMAIN_COLOR: Record<string, string> = {
  THEMIS: 'var(--themis)',
  APOLLO: 'var(--apollo)',
  BRIGID: 'var(--brigid)',
  NUWA: 'var(--nuwa)',
  HERMES: 'var(--hermes)',
  ATHENA: 'var(--athena)',
  SVAROG: 'var(--svarog)',
  SURYA: 'var(--surya)',
  TYR: 'var(--tyr)',
  TENGRI: 'var(--tengri)',
  THOTH: 'var(--thoth)',
  NEZHA: 'var(--nezha)',
};

export default function MagiCard({ magiId, domain, state, fictionalDate }: Props) {
  const color = DOMAIN_COLOR[magiId] ?? 'var(--accent)';
  const evo = state.evolution;

  return (
    <Link href={`/dashboard/${magiId.toLowerCase()}`} style={{ textDecoration: 'none' }}>
      <div className="magi-card" style={{ borderTopColor: color, borderTopWidth: '2px' }}>
        <div className="magi-card-id">MAGI · {magiId}</div>
        <div className="magi-card-domain" style={{ color }}>{domain}</div>

        <div style={{ margin: '0.75rem 0', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <EvolutionBar label="CUR" value={evo.curiosity} color={color} />
          <EvolutionBar label="ASS" value={evo.assertiveness} color={color} />
          <EvolutionBar label="EMO" value={evo.emotionalRange} color={color} />
          <EvolutionBar label="AWA" value={evo.selfAwareness} color={color} />
        </div>

        <div className="magi-card-date" style={{ color: 'var(--text-muted)' }}>
          YR {fictionalDate.year} · {fictionalDate.month} {fictionalDate.day}
        </div>

        {state.unresolved.length > 0 && (
          <div style={{ marginTop: '0.5rem', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {state.unresolved.length} UNRESOLVED
          </div>
        )}
      </div>
    </Link>
  );
}

function EvolutionBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="evolution-bar">
      <span className="evolution-bar-label" style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="evolution-bar-track">
        <div
          className="evolution-bar-fill"
          style={{ width: `${value * 100}%`, background: color, opacity: 0.6 }}
        />
      </div>
      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', width: '2rem', textAlign: 'right' }}>
        {value.toFixed(1)}
      </span>
    </div>
  );
}
