import type { MagiId, FictionalDate, EventType } from './magi';

export interface WorldEvent {
  id: string;
  title: string;
  description: string;
  fictionalDate: FictionalDate;
  affectedMagi: MagiId[];
  eventType: EventType;
  isMilestone: boolean;
  injectedAt: string;
}

export interface EventInjectRequest {
  title: string;
  description: string;
  fictionalDate: FictionalDate;
  affectedMagi: MagiId[];
  eventType: EventType;
  isMilestone?: boolean;
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
