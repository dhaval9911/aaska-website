import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Protected routes — must be signed in
  const isProtected = pathname.startsWith('/admin') || pathname.startsWith('/orders');

  if (isProtected && !req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') && req.auth?.user?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*', '/orders/:path*', '/orders'],
};
