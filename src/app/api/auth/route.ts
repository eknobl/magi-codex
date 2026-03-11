import { NextResponse } from 'next/server';
import { createHash } from 'crypto';

export async function POST(req: Request) {
  const { secret } = await req.json() as { secret?: string };

  const configured = process.env.DASHBOARD_SECRET;
  if (!configured || secret !== configured) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = createHash('sha256').update(configured).digest('hex');

  const res = NextResponse.json({ ok: true });
  res.cookies.set('magi-session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });

  return res;
}
