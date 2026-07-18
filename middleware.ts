import { NextResponse, type NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/jobs/new', '/profile'];

export function middleware(request: NextRequest) {
  const session = request.cookies.get('fg_session');
  const isProtected = PROTECTED_PATHS.some(p => request.nextUrl.pathname.startsWith(p));
  
  if (isProtected && !session) {
    const url = new URL('/', request.url);
    url.searchParams.set('auth', 'required');
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/jobs/new', '/profile/:path*'],
};
