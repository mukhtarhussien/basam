import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// تنبيه: هذا الميدل وير يتأكد بس إن كوكي الجلسة "موجودة" (فحص سريع
// وأولي بمستوى الحافة/edge). ما يتحقق إذا كانت الجلسة صحيحة فعلاً.
// الفحص الحقيقي يصير على مستوى السيرفر:
// - لصفحات الأدمن: app/admin/(protected)/layout.tsx عبر
//   verifyAdminSession() (جلسة أدمن مستقلة، باسوورد+TOTP)
// - لباقي الموقع: Better Auth (تسجيل دخول Google العادي للزباين)
// لا تعتمد على هذا الملف وحده للحماية.
//
// اسم كوكي جلسة الأدمن - يطابق ADMIN_SESSION_COOKIE بـ
// lib/admin-auth.ts (ما نستورد من هناك مباشرة لتفادي سحب كود
// Node.js/قاعدة البيانات لبيئة edge اللي يشتغل فيها الميدل وير)
const ADMIN_SESSION_COOKIE = "basam_admin_session";

const PUBLIC_PATHS = ["/login", "/admin/login", "/admin/totp-setup"];

function isPublicPath(pathname: string) {
  if (pathname.startsWith("/api/auth")) return true;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
    return true;
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
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.next();
  }

  // إجبار تسجيل الدخول على باقي صفحات الموقع (الرئيسية، المتجر،
  // المعاملات، الأخبار، الإعلانات...) - زائر بدون جلسة يروح لصفحة
  // تسجيل الدخول العامة، وبعد ما يسجل يرجعله لنفس الصفحة اللي طلبها.
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
