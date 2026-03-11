import { db } from '@/db';
import { magiStates } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import type { MagiState } from '@/types/magi';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(magiStates)
    .where(eq(magiStates.id, id.toUpperCase()));

  if (!row) {
    return NextResponse.json({ error: 'MAGI not found' }, { status: 404 });
  }

  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const body = await req.json() as Partial<MagiState>;

  const [existing] = await db
    .select()
    .from(magiStates)
    .where(eq(magiStates.id, id.toUpperCase()));

  if (!existing) {
    return NextResponse.json({ error: 'MAGI not found' }, { status: 404 });
  }

  const merged = { ...(existing.state as MagiState), ...body };

  const [updated] = await db
    .update(magiStates)
    .set({
      state: merged,
      fictionalYear: merged.currentFictionalDate?.year ?? existing.fictionalYear,
      fictionalMonth: merged.currentFictionalDate?.month ?? existing.fictionalMonth,
      fictionalDay: merged.currentFictionalDate?.day ?? existing.fictionalDay,
      updatedAt: new Date(),
    })
    .where(eq(magiStates.id, id.toUpperCase()))
    .returning();

  return NextResponse.json(updated);
}
