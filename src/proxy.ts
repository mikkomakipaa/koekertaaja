import { NextRequest, NextResponse } from 'next/server';
import {
  copyResponseCookies,
  createMiddlewareClient,
} from '@/lib/supabase/server-auth';

function buildLoginRedirect(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = '/login';
  redirectUrl.search = '';

  const originalPath = `${request.nextUrl.pathname}${request.nextUrl.search}`;
  redirectUrl.searchParams.set('redirect', originalPath);

  return redirectUrl;
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname === '/create' || request.nextUrl.pathname.startsWith('/create/')) {
    if (!user) {
      const redirectResponse = NextResponse.redirect(buildLoginRedirect(request));
      copyResponseCookies(response, redirectResponse);
      return redirectResponse;
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|play(?:/.*)?$|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$).*)',
  ],
};
