import { db } from '@/db';
import { worldEvents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json() as Partial<{
    title: string;
    description: string;
    fictionalYear: number;
    fictionalMonth: string;
    fictionalDay: number;
    affectedMagi: string[];
    eventTypes: string[];
    significance: string;
    status: string;
  }>;

  const [updated] = await db
    .update(worldEvents)
    .set(body)
    .where(eq(worldEvents.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;

  const [existing] = await db
    .select()
    .from(worldEvents)
    .where(eq(worldEvents.id, id));

  if (!existing) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  if (existing.status !== 'planned') {
    return NextResponse.json({ error: 'Only planned events can be deleted' }, { status: 409 });
  }

  await db.delete(worldEvents).where(eq(worldEvents.id, id));

  return new Response(null, { status: 204 });
}
