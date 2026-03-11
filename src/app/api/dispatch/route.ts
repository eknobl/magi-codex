import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { db } from '@/db';
import { dispatches, magiStates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { MagiState, Relationship } from '@/types/magi';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60;

function formatList(items: string[]): string {
  if (!items.length) return '- (none)';
  return items.map((i) => `- ${i}`).join('\n');
}

function formatRelationships(relationships: Partial<Record<string, Relationship>>): string {
  return Object.entries(relationships)
    .map(([id, r]) => {
      if (!r) return '';
      return `- ${id}: pattern=${r.pattern}, trust=${r.trust.toFixed(1)}, conflict=${r.conflict.toFixed(1)}`;
    })
    .filter(Boolean)
    .join('\n');
}

function buildDispatchPrompt(state: MagiState, trigger: string): string {
  const templatePath = path.join(process.cwd(), 'prompts', 'dispatch.md');
  let template = fs.readFileSync(templatePath, 'utf-8');

  const date = state.currentFictionalDate;
  const evo = state.evolution;
  const k = state.knowledge;

  return template
    .replace('{{MAGI_ID}}', state.id)
    .replace('{{DOMAIN}}', state.domain)
    .replace('{{YEAR}}', String(date.year))
    .replace('{{MONTH}}', date.month)
    .replace('{{DAY}}', String(date.day))
    .replace('{{OPTIMIZATION_TARGET}}', state.optimizationTarget)
    .replace('{{INTERPRETATION_CURRENT}}', state.interpretation.current)
    .replace('{{KNOWLEDGE_CONFIRMED}}', formatList(k.confirmed))
    .replace('{{KNOWLEDGE_SUSPECTED}}', formatList(k.suspected))
    .replace('{{RELATIONSHIPS_SUMMARY}}', formatRelationships(state.relationships))
    .replace('{{CURIOSITY}}', String(evo.curiosity))
    .replace('{{ASSERTIVENESS}}', String(evo.assertiveness))
    .replace('{{EMOTIONAL_RANGE}}', String(evo.emotionalRange))
    .replace('{{SELF_AWARENESS}}', String(evo.selfAwareness))
    .replace('{{UNRESOLVED}}', formatList(state.unresolved))
    .replace('{{RECENT_MEMORY}}', formatList(state.memory.recentParticipated))
    .replace('{{DISPATCH_TRIGGER}}', trigger);
}

export async function POST(req: Request) {
  const { magiId, trigger } = await req.json() as { magiId: string; trigger: string };

  if (!magiId || !trigger) {
    return new Response('magiId and trigger are required', { status: 400 });
  }

  const [row] = await db
    .select()
    .from(magiStates)
    .where(eq(magiStates.id, magiId.toUpperCase()));

  if (!row) {
    return new Response('MAGI not found', { status: 404 });
  }

  const state = row.state as MagiState;

  const systemPromptPath = path.join(process.cwd(), 'prompts', 'system.md');
  const systemPrompt = fs.readFileSync(systemPromptPath, 'utf-8');
  const userPrompt = buildDispatchPrompt(state, trigger);

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    prompt: userPrompt,
    maxTokens: 1024,
    onFinish: async ({ text, usage }) => {
      await db.insert(dispatches).values({
        magiId: magiId.toUpperCase(),
        fictionalYear: row.fictionalYear,
        fictionalMonth: row.fictionalMonth,
        fictionalDay: row.fictionalDay,
        content: text,
        promptUsed: userPrompt,
        tokensUsed: (usage.promptTokens ?? 0) + (usage.completionTokens ?? 0),
      });
    },
  });

  return result.toTextStreamResponse();
}
