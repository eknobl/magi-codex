import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

async function sha256hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method;

  // Cron route: verified by CRON_SECRET header — no cookie needed
  if (pathname.startsWith('/api/cron/')) {
    return NextResponse.next();
  }

  // Protected: mutating events API and timeline page
  const isProtectedRoute =
    pathname === '/dashboard/timeline' ||
    (pathname.startsWith('/api/events') && method !== 'GET');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const secret = process.env.DASHBOARD_SECRET;
  if (!secret) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Auth not configured' }, { status: 503 });
    }
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const expectedToken = await sha256hex(secret);
  const cookie = req.cookies.get('magi-session');

  if (cookie?.value === expectedToken) {
    return NextResponse.next();
  }

  // Redirect to login for page routes, 401 for API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/timeline', '/api/events/:path*', '/api/cron/:path*'],
};
