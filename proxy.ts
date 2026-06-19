import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const path = req.nextUrl.pathname;

  if (path.startsWith('/dashboard') && !token) {
    // Browser navigation — redirect to landing page
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (path.startsWith('/api/applications') && !token) {
    // API / fetch clients — return JSON 401 instead of a redirect
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  // Bug #3 fix: explicitly include exact root paths alongside wildcard sub-paths
  // so /dashboard and /api/applications (with no trailing slash) are also matched.
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/api/applications',
    '/api/applications/:path*',
  ],
};

// Alias used by proxy.test.ts
export const middleware = proxy;
