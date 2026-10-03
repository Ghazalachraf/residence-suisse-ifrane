import { NextResponse, type NextRequest } from 'next/server';
import { sessionToken } from './lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/login')) return NextResponse.next();
  const cookie = req.cookies.get('rs_session')?.value;
  if (cookie && process.env.APP_PASSWORD && cookie === (await sessionToken())) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/login';
  url.search = '';
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
