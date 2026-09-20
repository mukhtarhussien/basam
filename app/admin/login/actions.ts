"use server";

import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  createAdminSession,
  verifyAdminPassword,
  verifyAdminTotp,
} from "@/lib/admin-auth";

// خطوة 1: التحقق من الباسوورد. لو صح وماكو TOTP مفعّل بعد،
// ندخله مباشرة (أول مرة قبل ما يفعّل TOTP). لو TOTP مفعّل،
// نرجع "يحتاج TOTP" بدون ما ننشئ جلسة لسه.
export async function submitAdminPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (!password) return { error: "عبّي الباسوورد" };

  const result = await verifyAdminPassword(password);

  if (!result.ok) {
    if (result.reason === "locked") {
      return {
        error: `محاولات كثيرة غلط — حاول بعد ${result.secondsLeft} ثانية`,
      };
    }
    if (result.reason === "not_initialized") {
      return { error: "حساب الأدمن ما انهيّأ بعد — شوف لوجز السيرفر" };
    }
    return { error: "الباسوورد غلط" };
  }

  if (!result.totpEnabled) {
    // TOTP مو مفعّل بعد - ندخل مباشرة (وقت الإعداد الأول فقط)
    const session = await createAdminSession();
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_SESSION_COOKIE, session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: session.expiresAt,
      path: "/",
    });
    return { success: true as const, needsTotpSetup: true as const };
  }

  return { success: true as const, needsTotp: true as const };
}

// خطوة 2: التحقق من كود TOTP، ينشئ الجلسة الفعلية
export async function submitAdminTotp(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "عبّي الكود" };

  const result = await verifyAdminTotp(code);

  if (!result.ok) {
    if (result.reason === "locked") {
      return {
        error: `محاولات كثيرة غلط — حاول بعد ${result.secondsLeft} ثانية`,
      };
    }
    return { error: "الكود غلط" };
  }

  const session = await createAdminSession();
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: session.expiresAt,
    path: "/",
  });

  return { success: true as const };
}
