// يشتغل مرة وحدة تلقائياً عند بدء تشغيل السيرفر (كل نشر/deploy
// جديد على Vercel = تشغيل جديد). هذا مكان تهيئة حساب الأدمن:
// يتولد باسوورد عشوائي لو الجدول فاضي (أول مرة بس)، ويُطبع باللوجز.
// راجع lib/admin-auth.ts::ensureAdminAuthInitialized للتفاصيل.
export async function register() {
  // يشتغل بس على بيئة Node.js (مو edge)، لأن الاتصال بقاعدة
  // البيانات والتشفير يحتاجون Node runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureAdminAuthInitialized } = await import("@/lib/admin-auth");
    try {
      await ensureAdminAuthInitialized();
    } catch (err) {
      // ما نوقف تشغيل السيرفر كامل لو صار خطأ هنا (مثلاً قاعدة
      // البيانات مو جاهزة بعد) - بس نسجل الخطأ بوضوح
      // eslint-disable-next-line no-console
      console.error("[admin-auth] فشلت تهيئة حساب الأدمن الأولي:", err);
    }
  }
}
