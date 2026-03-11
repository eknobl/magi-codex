import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextResponse } from 'next/server';
import type { MagiState } from '@/types/magi';

export interface MagiScore {
  magiId: string;
  score: number;
  mode: 'full' | 'brief';
}

export async function POST(req: Request) {
  const { trigger, affectedMagiIds, magiStates } = await req.json() as {
    trigger: string;
    affectedMagiIds: string[];
    magiStates: MagiState[];
  };

  if (!trigger || !affectedMagiIds?.length || !magiStates?.length) {
    return NextResponse.json({ error: 'trigger, affectedMagiIds, and magiStates are required' }, { status: 400 });
  }

  const relevant = magiStates.filter((s) => affectedMagiIds.includes(s.id));

  const magiSummaries = relevant
    .map((s) => `- ${s.id}: domain="${s.domain}", target="${s.optimizationTarget}"`)
    .join('\n');

  const prompt = `You are scoring how central a world event is to each MAGI's domain and current mandate.

EVENT / TRIGGER:
${trigger}

MAGI TO SCORE:
${magiSummaries}

For each MAGI, return a score from 0.0 to 1.0 representing how directly this event falls within their domain and operational mandate. A score above 0.6 means this event is central to their function. Below 0.6 means it is tangential but worth brief acknowledgment.

Respond ONLY with a JSON array in this exact format (no explanation):
[{"magiId":"PROMETHEUS","score":0.85},{"magiId":"APOLLO","score":0.12},...]`;

  const { text: raw } = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    prompt,
    maxOutputTokens: 512,
  });

  // Extract JSON array from response (handle any surrounding text)
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) {
    return NextResponse.json({ error: 'Failed to parse scoring response', raw }, { status: 500 });
  }

  const parsed = JSON.parse(match[0]) as { magiId: string; score: number }[];

  const scores: MagiScore[] = parsed.map((item) => ({
    magiId: item.magiId,
    score: item.score,
    mode: item.score > 0.6 ? 'full' : 'brief',
  }));

  return NextResponse.json({ scores });
}
