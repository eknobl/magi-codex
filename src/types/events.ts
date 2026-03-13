import type { MagiId, FictionalDate, EventType } from './magi';

export type Significance = 'standard' | 'notable' | 'milestone' | 'epochal';

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  fictionalDate: FictionalDate;
  affectedMagi: MagiId[];
  eventTypes: EventType[];
  significance: Significance;
  injectedAt: string;
}

export interface EventInjectRequest {
  title: string;
  description: string;
  fictionalDate: FictionalDate;
  affectedMagi: MagiId[];
  eventTypes: EventType[];
  significance?: Significance;
  informedMagi?: Partial<Record<MagiId, string>>;
  notInformedMagi?: Partial<Record<MagiId, string>>;
  authorNote?: string;
}

// The author event prompt format from the spec
export interface AuthorEventPrompt {
  year: number;
  mode: 'sparse' | 'incident';
  event: string;
  context?: string;
  informed: Partial<Record<MagiId, string>>;
  notInformed: Partial<Record<MagiId, string>>;
  reportedActions?: Partial<Record<MagiId, string>>;
  authorNote?: string;
}
