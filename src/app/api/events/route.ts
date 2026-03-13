import { db } from '@/db';
import { worldEvents } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const rows = await db
    .select()
    .from(worldEvents)
    .orderBy(desc(worldEvents.fictionalYear));

  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json() as {
    title: string;
    description: string;
    fictionalYear: number;
    fictionalMonth: string;
    fictionalDay: number;
    affectedMagi?: string[];
    eventTypes: string[];
    significance?: string;
  };

  const { title, description, fictionalYear, fictionalMonth, fictionalDay, eventTypes } = body;

  if (!title || !description || fictionalYear === undefined || !fictionalMonth || !fictionalDay) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (!eventTypes || eventTypes.length === 0) {
    return NextResponse.json({ error: 'At least one event type is required' }, { status: 400 });
  }

  const [row] = await db
    .insert(worldEvents)
    .values({
      title,
      description,
      fictionalYear,
      fictionalMonth,
      fictionalDay,
      affectedMagi: body.affectedMagi ?? [],
      eventTypes,
      significance: body.significance ?? 'standard',
      status: 'planned',
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
