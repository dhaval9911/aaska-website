import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (req.auth.user?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/admin/:path*'],
};
