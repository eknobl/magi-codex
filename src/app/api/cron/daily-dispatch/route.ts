import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { db } from '@/db';
import { dispatches, magiStates, worldEvents, systemClock } from '@/db/schema';
import { eq, and, lte, inArray } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { MagiState } from '@/types/magi';
import { buildDispatchPrompt, readPromptFile } from '@/lib/dispatch';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// ── Constants ─────────────────────────────────────────────────────────────────

const SEED_HORIZON = 3;

// Incident sessions per significance tier
const SIG_INCIDENT_POSTS: Record<string, number> = {
  notable:   2,
  milestone: 4,
  epochal:   6,
};

// Fixed generation order — each MAGI sees all dispatches filed before it this session
const GENERATION_ORDER = [
  'PROMETHEUS', 'ATHENA', 'TYR', 'NEZHA', 'TENGRI',
  'SVAROG', 'SURYA', 'NUWA', 'APOLLO', 'BRIGID', 'THOTH', 'HERMES',
];

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ── Date helpers ──────────────────────────────────────────────────────────────

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function advanceDate(
  year: number, month: string, day: number
): { year: number; month: string; day: number } {
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

function advanceByDays(
  year: number, month: string, day: number, n: number
): { year: number; month: string; day: number } {
  let y = year, m = month, d = day;
  for (let i = 0; i < n; i++) {
    ({ year: y, month: m, day: d } = advanceDate(y, m, d));
  }
  return { year: y, month: m, day: d };
}

// ── Auto-seeding ──────────────────────────────────────────────────────────────

async function autoSeedUpcomingEvents(clockYear: number) {
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
        .set({ state: updated })
        .where(eq(magiStates.id, row.id));
    }

    await db
      .update(worldEvents)
      .set({ status: 'seeding' })
      .where(eq(worldEvents.id, event.id));
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Read global clock
  const [clock] = await db.select().from(systemClock).where(eq(systemClock.id, 1));
  if (!clock) {
    return NextResponse.json({ error: 'system_clock not seeded' }, { status: 500 });
  }

  const { fictionalYear, fictionalMonth, fictionalDay } = clock;
  const currentPeriodType = (clock.periodType ?? 'standard') as 'standard' | 'incident';
  const currentIncidentPostsRemaining = clock.incidentPostsRemaining ?? 0;

  // 2. Find today's triggering event (planned or seeding)
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

  // 3. Determine session period type
  let sessionPeriodType: 'standard' | 'incident';
  let newIncidentPostsRemaining: number;

  if (currentPeriodType === 'incident' && currentIncidentPostsRemaining > 0) {
    // Continue existing incident period, decrement counter
    sessionPeriodType = 'incident';
    newIncidentPostsRemaining = currentIncidentPostsRemaining - 1;
  } else if (
    activeEvent?.significance &&
    activeEvent.significance in SIG_INCIDENT_POSTS
  ) {
    // Significant event triggers a new incident period
    sessionPeriodType = 'incident';
    newIncidentPostsRemaining = SIG_INCIDENT_POSTS[activeEvent.significance] - 1;
  } else {
    sessionPeriodType = 'standard';
    newIncidentPostsRemaining = 0;
  }

  // 4. Advance interval: incident = 3–14 days, standard = 45–60 days
  const advanceDays = sessionPeriodType === 'incident'
    ? randomInt(3, 14)
    : randomInt(45, 60);

  // 5. Determine which MAGI generate this session
  let affectedMagiIds: string[];
  if (sessionPeriodType === 'incident' && activeEvent?.affectedMagi?.length) {
    affectedMagiIds = activeEvent.affectedMagi;
  } else {
    const allMagi = await db.select({ id: magiStates.id }).from(magiStates);
    affectedMagiIds = allMagi.map((r) => r.id);
  }

  // 6. Load all MAGI states and system prompt
  const allRows = await db.select().from(magiStates);
  const systemPrompt = readPromptFile('system.md');

  // 7. Sequential generation in fixed order
  //    Each MAGI receives all dispatches filed earlier in this session
  const sessionDispatches: { magiId: string; content: string }[] = [];
  const results: { magiId: string; ok: boolean; error?: string }[] = [];

  for (const magiId of GENERATION_ORDER) {
    if (!affectedMagiIds.includes(magiId)) continue;

    try {
      const row = allRows.find((r) => r.id === magiId);
      if (!row) {
        results.push({ magiId, ok: false, error: 'State not found' });
        continue;
      }

      const state = row.state as MagiState;
      const userPrompt = await buildDispatchPrompt(
        state,
        trigger,
        sessionPeriodType,
        sessionDispatches
      );

      const { text, usage } = await generateText({
        model: anthropic('claude-sonnet-4-6'),
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 1200,
      });

      // Make this dispatch available to all subsequent MAGI this session
      sessionDispatches.push({ magiId, content: text });

      await db.insert(dispatches).values({
        magiId,
        fictionalYear,
        fictionalMonth,
        fictionalDay,
        content: text,
        tokensUsed: (usage.inputTokens ?? 0) + (usage.outputTokens ?? 0),
        periodType: sessionPeriodType,
      });

      results.push({ magiId, ok: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ magiId, ok: false, error: msg });
    }
  }

  // 8. Mark triggering event resolved
  if (activeEvent) {
    await db
      .update(worldEvents)
      .set({ status: 'resolved' })
      .where(eq(worldEvents.id, activeEvent.id));
  }

  // 9. Advance clock by the full period interval
  const nextDate = advanceByDays(fictionalYear, fictionalMonth, fictionalDay, advanceDays);

  await db
    .update(systemClock)
    .set({
      fictionalYear: nextDate.year,
      fictionalMonth: nextDate.month,
      fictionalDay: nextDate.day,
      periodType: newIncidentPostsRemaining > 0 ? 'incident' : 'standard',
      incidentPostsRemaining: newIncidentPostsRemaining,
    })
    .where(eq(systemClock.id, 1));

  // 10. Auto-seed upcoming events
  await autoSeedUpcomingEvents(nextDate.year);

  const successful = results.filter((r) => r.ok).length;

  return NextResponse.json({
    date: `${fictionalYear} ${fictionalMonth} ${fictionalDay}`,
    nextDate: `${nextDate.year} ${nextDate.month} ${nextDate.day}`,
    advanceDays,
    periodType: sessionPeriodType,
    incidentPostsRemaining: newIncidentPostsRemaining,
    trigger: trigger.slice(0, 80),
    dispatches: results,
    summary: `${successful}/${results.length} ok`,
  });
}
