import { NextRequest, NextResponse } from 'next/server';

const OPEN_ROLE_COOKIE = 'dogfood_open_role';

type OpenRole = 'ADMIN' | 'ORGANIZER' | 'JUDGE' | 'PARTICIPANT';

function roleFromPath(pathname: string): OpenRole | null {
  if (pathname.startsWith('/admin')) return 'ADMIN';
  if (pathname.startsWith('/organizer')) return 'ORGANIZER';
  if (pathname.startsWith('/judge')) return 'JUDGE';
  if (pathname.startsWith('/participant')) return 'PARTICIPANT';
  return null;
}

/**
 * When AUTH_DISABLED, align open-access identity to the workspace path
 * before Server Components render — normal navigation is enough (no hard refresh).
 */
export function middleware(request: NextRequest) {
  const authDisabled =
    process.env.AUTH_DISABLED === 'true' ||
    process.env.NEXT_PUBLIC_AUTH_DISABLED === 'true';

  if (!authDisabled) {
    return NextResponse.next();
  }

  const role = roleFromPath(request.nextUrl.pathname);
  if (!role) {
    return NextResponse.next();
  }

  const current = request.cookies.get(OPEN_ROLE_COOKIE)?.value;
  const requestHeaders = new Headers(request.headers);

  // Ensure this request sees the workspace role immediately
  if (current !== role) {
    const cookieHeader = requestHeaders.get('cookie') || '';
    const withoutOld = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .filter((c) => c && !c.startsWith(`${OPEN_ROLE_COOKIE}=`))
      .join('; ');
    requestHeaders.set(
      'cookie',
      withoutOld ? `${withoutOld}; ${OPEN_ROLE_COOKIE}=${role}` : `${OPEN_ROLE_COOKIE}=${role}`
    );
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (current !== role) {
    response.cookies.set(OPEN_ROLE_COOKIE, role, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/organizer/:path*', '/judge/:path*', '/participant/:path*'],
};
