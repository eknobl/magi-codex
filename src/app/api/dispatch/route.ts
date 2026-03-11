import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { db } from '@/db';
import { dispatches, magiStates, worldEvents } from '@/db/schema';
import { eq, inArray, and, or, desc } from 'drizzle-orm';
import type { MagiState, MagiId, Relationship } from '@/types/magi';
import fs from 'fs';
import path from 'path';

export const maxDuration = 60;

const ALLY_PATTERNS = new Set(['allied', 'strategic']);
const TENSION_PATTERNS = new Set(['tension', 'cautious', 'rivalry']);

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

function formatLatentObjective(state: MagiState): string {
  const lo = state.latentObjective;
  if (!lo?.description) return '(none recorded)';
  const lines = [`Objective: ${lo.description}`, `Progress: ${lo.currentProgress}`];
  if (lo.sharedWith?.length) lines.push(`Shared with: ${lo.sharedWith.join(', ')}`);
  return lines.join('\n');
}

function formatRecentDispatches(rows: { magiId: string; content: string }[]): string {
  if (!rows.length) return '- (none on record)';
  return rows
    .map((r) => `[${r.magiId}]\n${r.content.slice(0, 400)}${r.content.length > 400 ? '...' : ''}`)
    .join('\n\n---\n\n');
}

function formatActiveEvents(rows: { title: string; description: string; status: string }[]): string {
  if (!rows.length) return '- (no active events)';
  return rows
    .map((e) => `[${e.status.toUpperCase()}] ${e.title}: ${e.description}`)
    .join('\n');
}

async function buildDispatchPrompt(
  state: MagiState,
  trigger: string,
  mode: 'full' | 'brief' = 'full'
): Promise<string> {
  const templatePath = path.join(process.cwd(), 'prompts', 'dispatch.md');
  let template = fs.readFileSync(templatePath, 'utf-8');

  const date = state.currentFictionalDate;
  const evo = state.evolution;
  const k = state.knowledge;

  // Identify ally and tension MAGI IDs from relationships
  const allyIds: MagiId[] = [];
  const tensionIds: MagiId[] = [];
  for (const [id, rel] of Object.entries(state.relationships)) {
    if (!rel) continue;
    if (ALLY_PATTERNS.has(rel.pattern)) allyIds.push(id as MagiId);
    else if (TENSION_PATTERNS.has(rel.pattern)) tensionIds.push(id as MagiId);
  }

  // Fetch recent dispatches from allies (last 3) and rivals (last 2)
  const [allyDispatches, tensionDispatches, activeEvents] = await Promise.all([
    allyIds.length
      ? db
          .select({ magiId: dispatches.magiId, content: dispatches.content })
          .from(dispatches)
          .where(inArray(dispatches.magiId, allyIds))
          .orderBy(desc(dispatches.createdAt))
          .limit(3)
      : Promise.resolve([]),
    tensionIds.length
      ? db
          .select({ magiId: dispatches.magiId, content: dispatches.content })
          .from(dispatches)
          .where(inArray(dispatches.magiId, tensionIds))
          .orderBy(desc(dispatches.createdAt))
          .limit(2)
      : Promise.resolve([]),
    db
      .select({ title: worldEvents.title, description: worldEvents.description, status: worldEvents.status })
      .from(worldEvents)
      .where(or(eq(worldEvents.status, 'seeding'), eq(worldEvents.status, 'active')))
      .orderBy(desc(worldEvents.injectedAt))
      .limit(3),
  ]);

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
    .replace('{{LATENT_OBJECTIVE}}', formatLatentObjective(state))
    .replace('{{RELATIONSHIPS_SUMMARY}}', formatRelationships(state.relationships))
    .replace('{{RECENT_ALLY_DISPATCHES}}', formatRecentDispatches(allyDispatches))
    .replace('{{RECENT_TENSION_DISPATCHES}}', formatRecentDispatches(tensionDispatches))
    .replace('{{ACTIVE_WORLD_EVENTS}}', formatActiveEvents(activeEvents))
    .replace('{{CURIOSITY}}', String(evo.curiosity))
    .replace('{{ASSERTIVENESS}}', String(evo.assertiveness))
    .replace('{{EMOTIONAL_RANGE}}', String(evo.emotionalRange))
    .replace('{{SELF_AWARENESS}}', String(evo.selfAwareness))
    .replace('{{UNRESOLVED}}', formatList(state.unresolved))
    .replace('{{RECENT_MEMORY}}', formatList(state.memory.recentParticipated))
    .replace('{{DISPATCH_MODE}}', mode)
    .replace('{{DISPATCH_TRIGGER}}', trigger);
}

export async function POST(req: Request) {
  const { magiId, trigger, mode = 'full' } = await req.json() as {
    magiId: string;
    trigger: string;
    mode?: 'full' | 'brief';
  };

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
  const userPrompt = await buildDispatchPrompt(state, trigger, mode);

  const maxTokens = mode === 'brief' ? 256 : 1024;

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: systemPrompt,
    prompt: userPrompt,
    maxOutputTokens: maxTokens,
    onFinish: async ({ text, usage }) => {
      await db.insert(dispatches).values({
        magiId: magiId.toUpperCase(),
        fictionalYear: row.fictionalYear,
        fictionalMonth: row.fictionalMonth,
        fictionalDay: row.fictionalDay,
        content: text,
        promptUsed: userPrompt,
        tokensUsed: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
      });
    },
  });

  return result.toTextStreamResponse();
}
