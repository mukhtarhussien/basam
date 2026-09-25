import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const ADMIN_SESSION_COOKIE = "basam_admin_session";

const PUBLIC_PATHS = ["/login", "/admin/login", "/admin/totp-setup"];

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/api/mobile")) return true;

  if (
    PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    )
  ) {
    return true;
  }

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE);

    if (!adminCookie) {
      return NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
    }

    return NextResponse.next();
  }

  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
