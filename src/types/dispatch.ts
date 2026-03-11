import type { MagiId, DispatchTier, FictionalDate } from './magi';

export interface DispatchFragment {
  id: string;
  magiId: MagiId;
  fictionalDate: FictionalDate;
  content: string;
  tier: DispatchTier;
  tokensUsed?: number;
  createdAt: string;
}

export interface DispatchGenerateRequest {
  magiId: MagiId;
  trigger: string;
  fictionalDate?: FictionalDate;
}

export interface DispatchGenerateResponse {
  dispatch: DispatchFragment;
  tokensUsed: number;
}

// The full collage dispatch — aggregates fragments from multiple MAGI
export interface MagiDispatch {
  year: number;
  monthRange: string;
  active: DispatchFragment[];
  reported: DispatchFragment[];
  generatedAt: string;
}
