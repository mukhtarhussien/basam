import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { adminAuth } from "@/db/schema";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  // هذا التحقق يصير على السيرفر بكل مرة تُطلب فيها صفحة أدمن،
  // ويتأكد من الجلسة الحقيقية بقاعدة البيانات (جدول admin_sessions
  // المستقل عن Better Auth). لا يمكن تجاوزه من أدوات المطور
  // بالمتصفح لأنه يصير بالكامل على السيرفر.
  const valid = await verifyAdminSession(token);
  if (!valid) {
    redirect("/admin/login");
  }

  // تأمين إضافي: جلسة صالحة وحدها ما تكفي لدخول لوحة التحكم
  // الكاملة لو TOTP لسه ما انفعّل. هذي الحالة تصير بس أول مرة
  // (بعد الباسوورد الصح مباشرة، قبل ما يفعّل TOTP بصفحة الإعداد) -
  // بدون هذا الفحص، أي حد يعرف الباسوورد بس (بدون TOTP) يقدر يدخل
  // للوحة كاملة لو صادف نفس النافذة الزمنية.
  const [row] = await db.select().from(adminAuth).limit(1);
  if (!row?.totpEnabled) {
    redirect("/admin/totp-setup");
  }

  return <>{children}</>;
}
