import { db } from '@/db';
import { systemClock } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Simple ping — keeps Supabase from auto-pausing on inactivity
  await db.select().from(systemClock).limit(1);

  return Response.json({ ok: true, ts: new Date().toISOString() });
}
