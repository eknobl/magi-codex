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
    eventType: string;
    isMilestone?: boolean;
  };

  const { title, description, fictionalYear, fictionalMonth, fictionalDay, eventType } = body;

  if (!title || !description || fictionalYear === undefined || !fictionalMonth || !fictionalDay || !eventType) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
      eventType,
      isMilestone: body.isMilestone ?? false,
      status: 'planned',
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
