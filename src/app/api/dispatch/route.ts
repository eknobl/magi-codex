import { anthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { db } from '@/db';
import { dispatches, magiStates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { MagiState } from '@/types/magi';
import { buildDispatchPrompt, readPromptFile } from '@/lib/dispatch';

export const maxDuration = 60;

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
  const systemPrompt = readPromptFile('system.md');
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
