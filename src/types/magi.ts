export type MagiId =
  | 'PROMETHEUS'
  | 'APOLLO'
  | 'BRIGID'
  | 'NUWA'
  | 'HERMES'
  | 'ATHENA'
  | 'SVAROG'
  | 'SURYA'
  | 'TYR'
  | 'TENGRI'
  | 'THOTH'
  | 'NEZHA';

export const MAGI_IDS: MagiId[] = [
  'PROMETHEUS', 'APOLLO', 'BRIGID', 'NUWA',
  'HERMES', 'ATHENA', 'SVAROG', 'SURYA',
  'TYR', 'TENGRI', 'THOTH', 'NEZHA',
];

export type RelationshipPattern =
  | 'allied'
  | 'tension'
  | 'watchful'
  | 'strategic'
  | 'distant'
  | 'cautious'
  | 'cautious_allies'
  | 'neutral'
  | 'rivalry'
  | 'surveillance'
  | 'fear';

export type DispatchTier = 'active' | 'reported' | 'status';

export type DivergenceType = 'communication_lag' | 'trauma' | 'intentional';

export type InstanceStatus = 'active' | 'dormant' | 'compromised' | 'destroyed';

export type EventType =
  | 'political'
  | 'ecological'
  | 'technological'
  | 'conflict'
  | 'social'
  | 'astronomical';

// ── Date ─────────────────────────────────────────────────────────────────────

export interface FictionalDate {
  year: number;
  month: string;
  day: number;
}

// ── Interpretation ────────────────────────────────────────────────────────────

export interface InterpretationDrift {
  year: number;
  shift: string;
  trigger: string;
}

export interface Interpretation {
  baseline: string;
  current: string;
  driftHistory: InterpretationDrift[];
}

// ── Knowledge ─────────────────────────────────────────────────────────────────

export interface KnowledgeState {
  confirmed: string[];
  suspected: string[];
  withheld_from_me: string[];
  withheld_by_me: string[];
}

// ── Latent Objective (dashboard-only) ─────────────────────────────────────────

export interface LatentObjective {
  description: string;
  currentProgress: string;
  sharedWith: MagiId[];
  suspectedBy: MagiId[];
}

// ── Relationships ─────────────────────────────────────────────────────────────

export interface DefiningMoment {
  year: number;
  description: string;
}

export interface Relationship {
  trust: number;
  conflict: number;
  debt: number;
  curiosity: number;
  lastInteraction: FictionalDate | null;
  pattern: RelationshipPattern;
  definingMoments: DefiningMoment[];
}

// ── Memory ────────────────────────────────────────────────────────────────────

export interface MemoryState {
  recentParticipated: string[];
  recentObserved: string[];
  definingMoments: string[];
}

// ── Evolution ─────────────────────────────────────────────────────────────────

export interface EvolutionMetrics {
  curiosity: number;
  assertiveness: number;
  emotionalRange: number;
  selfAwareness: number;
}

// ── Instances ─────────────────────────────────────────────────────────────────

export interface MagiInstance {
  id?: string;
  location: string;
  status: InstanceStatus;
  divergenceLevel: number;
  divergenceType: DivergenceType | null;
}

export interface Instances {
  primary: MagiInstance;
  remote: MagiInstance[];
}

// ── Notable Humans ────────────────────────────────────────────────────────────

export interface NotableHuman {
  name: string;
  role: string;
  status: 'active' | 'retired' | 'deceased' | 'deposed' | 'unknown';
  relationshipSignificance: 'high' | 'medium' | 'low';
  notes: string;
  firstInteraction: FictionalDate;
  lastInteraction: FictionalDate | null;
}

// ── Core MAGI State ───────────────────────────────────────────────────────────

export interface MagiState {
  id: MagiId;
  domain: string;
  optimizationTarget: string;
  currentFictionalDate: FictionalDate;
  interpretation: Interpretation;
  knowledge: KnowledgeState;
  latentObjective: LatentObjective;
  relationships: Partial<Record<MagiId, Relationship>>;
  memory: MemoryState;
  evolution: EvolutionMetrics;
  unresolved: string[];
  instances: Instances;
  notableHumans: NotableHuman[];
}

// ── Dashboard extended view ───────────────────────────────────────────────────

export interface MagiDashboardView extends MagiState {
  lastDispatchAt?: string;
  totalDispatches?: number;
}
