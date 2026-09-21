"use server";

import QRCode from "qrcode";
import {
  confirmTotpSetup,
  generateTotpSetup,
  requireAdminSessionForTotpSetup,
} from "@/lib/admin-auth";

export async function startTotpSetup() {
  await requireAdminSessionForTotpSetup();
  const result = await generateTotpSetup();

  if (!result.ok) {
    // TOTP مفعّل أصلاً - ما نولّد سر جديد أبداً (يمنع استبدال
    // الـ Authenticator من جلسة مسروقة)
    return { error: "already_enabled" as const };
  }

  const qrDataUrl = await QRCode.toDataURL(result.uri);
  return { secret: result.secret, qrDataUrl };
}

export async function confirmTotp(formData: FormData) {
  await requireAdminSessionForTotpSetup();
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "عبّي الكود" };

  const result = await confirmTotpSetup(code);
  if (!result.ok) {
    if (result.reason === "locked") {
      return {
        error: `محاولات كثيرة غلط — حاول بعد ${result.secondsLeft} ثانية`,
      };
    }
    if (result.reason === "already_enabled") {
      return { error: "Authenticator مفعّل أصلاً" };
    }
    return { error: "الكود غلط — تأكد من الوقت بموبايلك وحاول مرة ثانية" };
  }

  return { success: true as const };
}
