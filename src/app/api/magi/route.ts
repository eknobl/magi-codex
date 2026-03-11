import { db } from '@/db';
import { magiStates } from '@/db/schema';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(magiStates).orderBy(magiStates.id);
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
