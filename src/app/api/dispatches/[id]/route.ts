import { createHash } from 'crypto';
import { db } from '@/db';
import { dispatches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

function checkAuth(req: Request): boolean {
  const cookie = req.headers.get('cookie') ?? '';
  const sessionCookie = cookie.split(';').find((c) => c.trim().startsWith('magi-session='));
  const token = sessionCookie?.split('=')[1]?.trim();
  const secret = process.env.DASHBOARD_SECRET;
  if (!secret || !token) return false;
  const expected = createHash('sha256').update(secret).digest('hex');
  return token === expected;
}

export async function PATCH(req: Request, { params }: RouteContext) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { content?: string };

  if (!body.content?.trim()) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  const [updated] = await db
    .update(dispatches)
    .set({ content: body.content })
    .where(eq(dispatches.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: 'Dispatch not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}
