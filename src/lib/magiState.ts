import type { MagiId, MagiState, Relationship, RelationshipPattern } from '@/types/magi';

// Relationship threshold logic from the spec
export const THRESHOLDS = {
  TRUST_ALLIANCE: 0.85,
  TRUST_CONFRONTATION: 0.25,
  CONFLICT_RIVALRY: 0.7,
  DEBT_EXPECTATION: 0.7,
  DEBT_AVOIDANCE: -0.7,
  CURIOSITY_SURVEILLANCE: 0.8,
  TRUST_FEAR: 0.1,
  CONFLICT_FEAR: 0.8,
} as const;

export function computePattern(rel: Relationship, noInteractionYears: number): RelationshipPattern {
  const { trust, conflict, curiosity } = rel;

  if (trust < THRESHOLDS.TRUST_FEAR && conflict > THRESHOLDS.CONFLICT_FEAR) return 'fear';
  if (curiosity > THRESHOLDS.CURIOSITY_SURVEILLANCE && noInteractionYears >= 5) return 'surveillance';
  if (conflict > THRESHOLDS.CONFLICT_RIVALRY) return 'rivalry';
  if (trust > THRESHOLDS.TRUST_ALLIANCE) return 'allied';
  if (trust < THRESHOLDS.TRUST_CONFRONTATION) return 'tension';

  return rel.pattern;
}

export function getRelationshipSummary(state: MagiState): string {
  return Object.entries(state.relationships)
    .map(([id, rel]) => {
      if (!rel) return '';
      return `${id}: ${rel.pattern} (trust=${rel.trust.toFixed(2)}, conflict=${rel.conflict.toFixed(2)})`;
    })
    .filter(Boolean)
    .join('\n');
}

export function getMagiColor(magiId: string): string {
  const colors: Record<string, string> = {
    PROMETHEUS: '#cc8844',
    APOLLO: '#44cc88',
    BRIGID: '#cc44aa',
    NUWA: '#44aa66',
    HERMES: '#aaaa44',
    ATHENA: '#4488cc',
    SVAROG: '#cc6644',
    SURYA: '#ccaa44',
    TYR: '#cc4444',
    TENGRI: '#44aacc',
    THOTH: '#8844cc',
    NEZHA: '#44cccc',
  };
  return colors[magiId] ?? '#6666ff';
}

// Check which thresholds are currently triggered for a given relationship pair
export function getTriggeredThresholds(rel: Relationship): string[] {
  const triggered: string[] = [];

  if (rel.trust > THRESHOLDS.TRUST_ALLIANCE) triggered.push('TRUST_ALLIANCE');
  if (rel.trust < THRESHOLDS.TRUST_CONFRONTATION) triggered.push('TRUST_CONFRONTATION');
  if (rel.conflict > THRESHOLDS.CONFLICT_RIVALRY) triggered.push('CONFLICT_RIVALRY');
  if (rel.debt > THRESHOLDS.DEBT_EXPECTATION) triggered.push('DEBT_EXPECTATION_A');
  if (rel.debt < THRESHOLDS.DEBT_AVOIDANCE) triggered.push('DEBT_AVOIDANCE');
  if (rel.trust < THRESHOLDS.TRUST_FEAR && rel.conflict > THRESHOLDS.CONFLICT_FEAR) triggered.push('FEAR');

  return triggered;
}

// Domain conflict pairs from the spec
export const DOMAIN_CONFLICTS: [MagiId, MagiId, string][] = [
  ['NUWA', 'SVAROG', 'Ecological preservation vs. construction and expansion'],
  ['NUWA', 'SURYA', 'Biosphere balance vs. maximum energy output'],
  ['PROMETHEUS', 'TYR', 'Rights and process vs. security and preemption'],
  ['PROMETHEUS', 'HERMES', 'Legal transparency vs. information shaping'],
  ['THOTH', 'NEZHA', 'Open discovery vs. digital security'],
  ['BRIGID', 'HERMES', 'Cultural authenticity vs. information management'],
  ['TYR', 'ATHENA', 'Military action vs. probabilistic restraint'],
  ['SURYA', 'NUWA', 'Energy maximization vs. ecological cost'],
];

export function getActiveConflicts(magiId: MagiId): typeof DOMAIN_CONFLICTS {
  return DOMAIN_CONFLICTS.filter(([a, b]) => a === magiId || b === magiId);
}
