import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { db } from '@/db';
import { dispatches, magiStates, worldEvents, systemClock } from '@/db/schema';
import { eq, and, lte, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { MagiState } from '@/types/magi';
import { buildDispatchPrompt, readPromptFile } from '@/lib/dispatch';
interface MagiScore { magiId: string; score: number; mode: 'full' | 'brief' }

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const SEED_HORIZON = 3; // fictional years ahead to start seeding anticipation

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function advanceDate(year: number, month: string, day: number): { year: number; month: string; day: number } {
  const daysInMonth: Record<string, number> = {
    January: 31, February: 28, March: 31, April: 30, May: 31, June: 30,
    July: 31, August: 31, September: 30, October: 31, November: 30, December: 31,
  };
  const maxDay = daysInMonth[month] ?? 30;
  if (day < maxDay) return { year, month, day: day + 1 };
  const monthIdx = MONTH_ORDER.indexOf(month);
  if (monthIdx < 11) return { year, month: MONTH_ORDER[monthIdx + 1], day: 1 };
  return { year: year + 1, month: 'January', day: 1 };
}

async function autoSeedUpcomingEvents(clockYear: number) {
  // Find planned events within SEED_HORIZON years
  const upcoming = await db
    .select()
    .from(worldEvents)
    .where(
      and(
        eq(worldEvents.status, 'planned'),
        lte(worldEvents.fictionalYear, clockYear + SEED_HORIZON)
      )
    );

  for (const event of upcoming) {
    const affected = event.affectedMagi ?? [];
    if (!affected.length) continue;

    // Add anticipation hint to each affected MAGI's knowledge.suspected
    const rows = await db
      .select()
      .from(magiStates)
      .where(inArray(magiStates.id, affected));

    for (const row of rows) {
      const state = row.state as MagiState;
      const hint = `Anticipating: ${event.title} (projected ~Year ${event.fictionalYear})`;
      if (state.knowledge.suspected.includes(hint)) continue;

      const updated: MagiState = {
        ...state,
        knowledge: {
          ...state.knowledge,
          suspected: [...state.knowledge.suspected, hint],
        },
      };

      await db
        .update(magiStates)
        .set({ state: updated, updatedAt: new Date() })
        .where(eq(magiStates.id, row.id));
    }

    // Advance event status to 'seeding'
    await db
      .update(worldEvents)
      .set({ status: 'seeding' })
      .where(eq(worldEvents.id, event.id));
  }
}

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Read global clock
  const [clock] = await db.select().from(systemClock).where(eq(systemClock.id, 1));
  if (!clock) {
    return NextResponse.json({ error: 'system_clock not seeded' }, { status: 500 });
  }

  const { fictionalYear, fictionalMonth, fictionalDay } = clock;

  // Find active world event for today
  const [todayEvent] = await db
    .select()
    .from(worldEvents)
    .where(
      and(
        eq(worldEvents.fictionalYear, fictionalYear),
        eq(worldEvents.fictionalMonth, fictionalMonth),
        eq(worldEvents.fictionalDay, fictionalDay),
        eq(worldEvents.status, 'planned')
      )
    )
    .limit(1);

  // Also check seeding events that match today's date
  const [seedingEvent] = !todayEvent
    ? await db
        .select()
        .from(worldEvents)
        .where(
          and(
            eq(worldEvents.fictionalYear, fictionalYear),
            eq(worldEvents.fictionalMonth, fictionalMonth),
            eq(worldEvents.fictionalDay, fictionalDay),
            eq(worldEvents.status, 'seeding')
          )
        )
        .limit(1)
    : [undefined];

  const activeEvent = todayEvent ?? seedingEvent;

  const trigger = activeEvent
    ? activeEvent.description
    : `Daily operations log — Year ${fictionalYear}, ${fictionalMonth} ${fictionalDay}`;

  const affectedMagiIds = activeEvent?.affectedMagi?.length
    ? activeEvent.affectedMagi
    : (await db.select({ id: magiStates.id }).from(magiStates)).map((r) => r.id);

  // Load all MAGI states
  const allRows = await db.select().from(magiStates);
  const allStates = allRows.map((r) => r.state as MagiState);

  // Score relevance (deterministic — no API call)
  const baseUrl = process.env.SITE_URL ?? 'http://localhost:3000';
  const scoreRes = await fetch(`${baseUrl}/api/dispatch/score`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trigger, affectedMagiIds, magiStates: allStates }),
  });

  if (!scoreRes.ok) {
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
  }

  const { scores } = (await scoreRes.json()) as { scores: MagiScore[] };

  // Generate dispatches inline with generateText — avoids onFinish race condition
  // that loses saves when Vercel terminates the streaming function too early.
  const systemPrompt = readPromptFile('system.md');

  const results = await Promise.all(
    scores.map(async ({ magiId, mode }) => {
      try {
        const row = allRows.find((r) => r.id === magiId);
        if (!row) return { magiId, mode, ok: false };

        const state = row.state as MagiState;
        const userPrompt = await buildDispatchPrompt(state, trigger, mode);

        const { text, usage } = await generateText({
          model: anthropic('claude-sonnet-4-6'),
          system: systemPrompt,
          prompt: userPrompt,
          maxOutputTokens: mode === 'brief' ? 256 : 1024,
        });

        await db.insert(dispatches).values({
          magiId,
          fictionalYear,
          fictionalMonth,
          fictionalDay,
          content: text,
          tokensUsed: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
        });

        return { magiId, mode, ok: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { magiId, mode, ok: false, error: msg };
      }
    })
  );

  // Mark event as active (then resolved after dispatches)
  if (activeEvent) {
    await db
      .update(worldEvents)
      .set({ status: 'resolved' })
      .where(eq(worldEvents.id, activeEvent.id));
  }

  // Advance global clock
  const next = advanceDate(fictionalYear, fictionalMonth, fictionalDay);
  await db
    .update(systemClock)
    .set({ fictionalYear: next.year, fictionalMonth: next.month, fictionalDay: next.day, updatedAt: new Date() })
    .where(eq(systemClock.id, 1));

  // Auto-seed upcoming events
  await autoSeedUpcomingEvents(next.year);

  return NextResponse.json({
    date: { year: fictionalYear, month: fictionalMonth, day: fictionalDay },
    trigger,
    dispatches: results,
    nextDate: next,
  });
}
