import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
	const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
	const isProtected =
		req.nextUrl.pathname.startsWith('/dashboard') ||
		req.nextUrl.pathname.startsWith('/api/applications');

	if (isProtected && !token) {
		return NextResponse.redirect(new URL('/', req.url));
	}

	return NextResponse.next();
}

export { proxy as middleware };

export const config = {
	matcher: ['/dashboard/:path*', '/api/applications/:path*'],
};
