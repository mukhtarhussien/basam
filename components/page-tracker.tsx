"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordPageView } from "@/app/actions";

const VISITOR_COOKIE = "basam_vid";

// يقرأ معرّف الزائر من كوكي محلي، أو يولّد واحد جديد عشوائي لو ما
// كان موجود. هذا المعرّف عشوائي بحت (ما فيه أي معلومة عن الشخص) -
// غرضه الوحيد إننا نميّز "زيارة جديدة" عن "نفس الزائر رجع"، عشان
// نحسب "زوار فريدون" بلوحة الأدمن.
function getOrCreateVisitorId(): string {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${VISITOR_COOKIE}=([^;]+)`)
  );
  if (match) return match[1];

  const id =
    crypto.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  // كوكي لسنة، بدون معلومات شخصية بداخله - رقم عشوائي فقط
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${VISITOR_COOKIE}=${id}; path=/; max-age=${maxAge}; SameSite=Lax`;
  return id;
}

export default function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // نتجاهل بصمت أي فشل (مثلاً الكوكيز معطلة بالمتصفح) - التتبع
    // تحسيني، ما يجوز يوقف تصفح الموقع لو فشل
    try {
      const visitorId = getOrCreateVisitorId();
      recordPageView(pathname, visitorId).catch(() => {});
    } catch {
      // تجاهل
    }
  }, [pathname]);

  return null;
}
