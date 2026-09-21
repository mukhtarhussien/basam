import "server-only";
import { auth } from "./auth";
import { headers } from "next/headers";

// يرجّع الجلسة الحقيقية (أو null) بعد تحقق فعلي من قاعدة البيانات.
// استخدم هذي الدالة داخل Server Components / Route Handlers فقط.
// ملاحظة: هذي جلسة الزبون العادي (Google/رقم موبايل) - حماية
// لوحة التحكم صارت نظام منفصل تماماً، راجع lib/admin-auth.ts
// و requireAdminSession() هناك.
export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
