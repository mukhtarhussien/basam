"use server";

import { db } from "@/db";
import {
  transactions,
  transactionDocuments,
  products,
  news,
  ads,
  payments,
  orders,
  notifications,
<<<<<<< HEAD
  siteSettings,
  pageViews,
=======
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162
} from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ADMIN_SESSION_COOKIE,
  changeAdminPassword,
  destroyAdminSession,
  requireAdminSession,
} from "@/lib/admin-auth";
import { getServerSession } from "@/lib/auth-server";

// حد أعلى لحجم مستند المعاملة الواحد (5 ميغا). القاعدة تخزن الملف
// base64 (ماكو خدمة تخزين خارجية مربوطة بالمشروع حالياً)، فحجم
// كبير يثقّل على القاعدة مباشرة - لهذا الحد صارم نسبياً.
const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;

// حدود عامة للإدخال - تمنع أرقام خيالية أو نصوص ضخمة
const MAX_ORDER_QUANTITY = 100;
const MAX_PAYMENT_AMOUNT = 100_000_000; // 100 مليون د.ع (تحت حد integer بمسافة كبيرة)
const MAX_TEXT_LENGTH = 500;
const MAX_NOTES_LENGTH = 2000;

// يتحقق من "المحتوى الفعلي" للملف (أول بايتات = magic bytes) بدل
// الاعتماد على file.type اللي يجي من المتصفح ويقدر أي أحد يزوّره.
// يرجّع نوع الملف الحقيقي، أو null لو مو صورة/PDF معروف.
function detectFileType(
  buf: Buffer
): "image/jpeg" | "image/png" | "image/webp" | "application/pdf" | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";
  // WEBP: "RIFF" .... "WEBP"
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) return "image/webp";
  // PDF: "%PDF-"
  if (buf.toString("ascii", 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

// اسم الملف يجي من المستخدم - ننظفه (بدون مسارات أو رموز غريبة)
function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\/]/g, "_")
    .replace(/[^\p{L}\p{N}._ -]/gu, "_")
    .trim()
    .slice(0, 100);
  return cleaned || "مستند";
}

// ============================================================
// قراءة (تُستخدم من صفحات العرض العامة + لوحة التحكم)
// ============================================================

// أدمن فقط - ترجّع بيانات كل العملاء (اسم، هاتف، ملاحظات). محمية
// هنا صراحة حتى لو الاستدعاء الحالي الوحيد (لوحة التحكم) محمي
// أصلاً بـ layout.tsx، تفادياً لتسريب البيانات لو انضاف استدعاء
// جديد لها من مكان غير محمي بالمستقبل.
export async function getTransactions() {
  await requireAdminSession();
  return db.select().from(transactions).orderBy(desc(transactions.createdAt));
}

export async function getProducts() {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

// يرجّع بس المنتجات اللي الأدمن فعّلها لهذا المكان (الإعلانات أو
// الرئيسية) - يُستخدم من صفحة /ads وصفحة / الرئيسية
export async function getProductsByPlacement(place: "ads" | "home") {
  return db
    .select()
    .from(products)
    .where(sql`${place}::product_placement = ANY(${products.placement})`)
    .orderBy(desc(products.createdAt));
}

export async function getNews() {
  return db.select().from(news).orderBy(desc(news.createdAt));
}

export async function getAds() {
  return db.select().from(ads).orderBy(desc(ads.createdAt));
}

// ============================================================
// المعاملات - تقديم طلب (أي زائر مسجل دخول أو لا)
// ============================================================

// لازم تسجيل دخول (Google أو رقم موبايل) عشان نقدر نربط المعاملة
// بحساب المستخدم ونوصله إشعار داخل التطبيق بعدين لما الأدمن يخلص
// منها. الميدل وير (middleware.ts) أصلاً يمنع زائر غير مسجل من
// الوصول لصفحة /transactions، وهذا الفحص هنا طبقة حماية ثانية على
// مستوى الـ action نفسه - ما نعتمد على الميدل وير وحده.
export async function submitTransaction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return { error: "لازم تسجل دخول عشان تقدر ترفع معاملة" };
  }

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!fullName || !phone || !type) {
    return { error: "عبّي الاسم ورقم الهاتف ونوع المعاملة" };
  }
  if (
    fullName.length > MAX_TEXT_LENGTH ||
    phone.length > 30 ||
    type.length > MAX_TEXT_LENGTH ||
    notes.length > MAX_NOTES_LENGTH
  ) {
    return { error: "أحد الحقول أطول من المسموح" };
  }

  // بيانات الدفع اختيارية - تجي من PaymentMethodPicker إذا المستخدم اختار طريقة
  const paymentMethod = String(formData.get("paymentMethod") ?? "");
  const paymentAmountRaw = String(formData.get("paymentAmount") ?? "");
  const paymentReference = String(formData.get("paymentReference") ?? "").trim();
  const paymentSenderPhone = String(
    formData.get("paymentSenderPhone") ?? ""
  ).trim();

  if (
    paymentMethod &&
    (paymentMethod === "zain_cash" || paymentMethod === "asia_hawala")
  ) {
    const paymentAmount = Number(paymentAmountRaw.replace(/[^\d]/g, ""));
    if (!paymentAmount || !paymentReference) {
      return { error: "عبّي مبلغ الحوالة ورقمها المرجعي، أو ألغِ اختيار الدفع" };
    }
    if (paymentAmount > MAX_PAYMENT_AMOUNT || paymentReference.length > 100) {
      return { error: "مبلغ أو رقم مرجعي غير صالح" };
    }
  }

  // مستند إثبات (اختياري) - صورة أو PDF يوضح المعاملة. نخزنه
  // base64 داخل القاعدة (راجع MAX_DOCUMENT_SIZE_BYTES بالأعلى)
  const file = formData.get("document");
  let documentPayload: { fileName: string; fileType: string; fileData: string } | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return { error: "حجم الملف أكبر من المسموح (5 ميغا كحد أعلى)" };
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    // ما نثق بـ file.type (المتصفح يرسله وأي أحد يقدر يزوّره).
    // نقرأ أول بايتات الملف الفعلية ونحدد نوعه منها.
    const realType = detectFileType(buffer);
    if (!realType) {
      return { error: "نوع الملف غير مدعوم - لازم يكون صورة (jpg/png/webp) أو PDF" };
    }
    documentPayload = {
      fileName: sanitizeFileName(file.name),
      fileType: realType, // النوع الحقيقي، مو اللي ادّعاه المتصفح
      fileData: buffer.toString("base64"),
    };
  }

  const [created] = await db
    .insert(transactions)
    .values({
      userId: session.user.id,
      fullName,
      phone,
      type,
      notes: notes || null,
    })
    .returning();

  if (documentPayload) {
    await db.insert(transactionDocuments).values({
      transactionId: created.id,
      ...documentPayload,
    });
  }

  if (paymentMethod === "zain_cash" || paymentMethod === "asia_hawala") {
    const paymentAmount = Number(paymentAmountRaw.replace(/[^\d]/g, ""));
    await db.insert(payments).values({
      userId: session.user.id,
      transactionId: created.id,
      method: paymentMethod,
      amount: paymentAmount,
      referenceNumber: paymentReference,
      senderPhone: paymentSenderPhone || null,
      status: "pending",
    });
  }

  revalidatePath("/admin");
  return { success: true, transactionId: created.id };
}

// الأدمن بس يقدر يبدل حالة المعاملة. لما تتحول لـ"جاهزة" (تم
// التنفيذ)، ننشئ إشعار داخل التطبيق لصاحب المعاملة (لو مسجل بحساب
// مربوط - كل معاملة الحين لازم تكون مربوطة بحساب، راجع
// submitTransaction). لو رجعناها لـ"قيد الانتظار" ما ننشئ إشعار.
export async function toggleTransactionStatus(id: number) {
  await requireAdminSession();

  const [current] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id));

  if (!current) return { error: "المعاملة غير موجودة" };

  const newStatus = current.status === "pending" ? "ready" : "pending";

  await db
    .update(transactions)
    .set({
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, id));

  if (newStatus === "ready" && current.userId) {
    await db.insert(notifications).values({
      userId: current.userId,
      title: "معاملتك جاهزة",
      body: `معاملة "${current.type}" (${current.fullName}) خلص تنفيذها. تفضل استلمها.`,
      transactionId: current.id,
    });
  }

  revalidatePath("/admin");
}

// أدمن فقط - يشوف مستندات أي معاملة من لوحة التحكم
export async function getTransactionDocuments(transactionId: number) {
  await requireAdminSession();
  return db
    .select()
    .from(transactionDocuments)
    .where(eq(transactionDocuments.transactionId, transactionId));
}

// الزبون نفسه - يشوف مستندات معاملته هو بس (يتأكد إن المعاملة
// تعود لحسابه قبل ما يرجّع أي شي، حتى لو خمّن رقم معاملة غيره)
export async function getMyTransactionDocuments(transactionId: number) {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  const [owned] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId));

  if (!owned || owned.userId !== session.user.id) return [];

  return db
    .select()
    .from(transactionDocuments)
    .where(eq(transactionDocuments.transactionId, transactionId));
}

// ============================================================
// المتجر (أدمن فقط للإضافة/الحذف)
// ============================================================

export async function addProduct(formData: FormData) {
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = Number(priceRaw.replace(/[^\d]/g, ""));

  if (!name || !price) {
    return { error: "عبّي اسم المنتج والسعر" };
  }

  // إعدادات متقدمة: وين يظهر المنتج (الإعلانات و/أو الرئيسية).
  // الفورم يرسل placement كقيم متعددة بنفس الاسم لكل خيار مفعّل
  const placementRaw = formData.getAll("placement").map(String);
  const placement = placementRaw.filter(
    (p): p is "ads" | "home" => p === "ads" || p === "home"
  );

  await db.insert(products).values({ name, price, placement });
  revalidatePath("/admin");
  revalidatePath("/store");
  revalidatePath("/ads");
  revalidatePath("/");
}

export async function deleteProduct(id: number) {
  await requireAdminSession();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/admin");
  revalidatePath("/store");
  revalidatePath("/ads");
  revalidatePath("/");
}

// ============================================================
// الأخبار (أدمن فقط)
// ============================================================

export async function addArticle(formData: FormData) {
  await requireAdminSession();

  const title = String(formData.get("title") ?? "").trim();
  const featured = formData.get("featured") === "on";

  if (!title) return { error: "عبّي عنوان الخبر" };

  await db.insert(news).values({ title, featured });
  revalidatePath("/admin");
  revalidatePath("/news");
}

export async function deleteArticle(id: number) {
  await requireAdminSession();
  await db.delete(news).where(eq(news.id, id));
  revalidatePath("/admin");
  revalidatePath("/news");
}

// ============================================================
// الإعلانات (أدمن فقط)
// ============================================================

export async function addAd(formData: FormData) {
  await requireAdminSession();

  const title = String(formData.get("title") ?? "").trim();
  const duration = String(formData.get("duration") ?? "أسبوع");

  if (!title) return { error: "عبّي نص الإعلان" };

  await db.insert(ads).values({ title, duration });
  revalidatePath("/admin");
  revalidatePath("/ads");
}

export async function deleteAd(id: number) {
  await requireAdminSession();
  await db.delete(ads).where(eq(ads.id, id));
  revalidatePath("/admin");
  revalidatePath("/ads");
}

// ============================================================
// طلبات المتجر (order + payment مربوطين ببعض)
// ============================================================

export async function submitOrder(formData: FormData) {
  // تسجيل الدخول إجباري (الميدل وير يفرضه على الصفحة أصلاً، وهذا
  // طبقة ثانية على مستوى الـ action نفسه - ما نعتمد على الميدل وير
  // وحده لأن أي أحد يقدر يستدعي server action مباشرة)
  const session = await getServerSession();
  if (!session?.user?.id) {
    return { error: "لازم تسجل دخول عشان تقدر تطلب" };
  }

  const productId = Number(formData.get("productId") ?? 0);
  const quantityRaw = Number(formData.get("quantity") ?? 1);

  // الكمية لازم تكون عدد صحيح موجب وبحد أعلى. كان الكود القديم
  // يقبل أي رقم (مثلاً 999999999) فيتجاوز حدود integer بالقاعدة
  // أو يطلع سعر خيالي. Number("abc") = NaN فنغطيها بـ isInteger.
  if (
    !Number.isInteger(quantityRaw) ||
    quantityRaw < 1 ||
    quantityRaw > MAX_ORDER_QUANTITY
  ) {
    return { error: `الكمية لازم تكون بين 1 و ${MAX_ORDER_QUANTITY}` };
  }
  const quantity = quantityRaw;

  const paymentMethodRaw = String(formData.get("paymentMethod") ?? "");
  const paymentReference = String(formData.get("paymentReference") ?? "").trim();
  const paymentSenderPhone = String(
    formData.get("paymentSenderPhone") ?? ""
  ).trim();

  if (!Number.isInteger(productId) || productId < 1) {
    return { error: "منتج غير معروف" };
  }
  if (paymentMethodRaw !== "zain_cash" && paymentMethodRaw !== "asia_hawala") {
    return { error: "اختر طريقة دفع" };
  }
  const paymentMethod: "zain_cash" | "asia_hawala" = paymentMethodRaw;
  if (!paymentReference) {
    return { error: "عبّي الرقم المرجعي للحوالة" };
  }
  if (paymentReference.length > 100 || paymentSenderPhone.length > 30) {
    return { error: "الرقم المرجعي أو رقم الهاتف أطول من المسموح" };
  }

  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, productId));

  if (!product) return { error: "المنتج غير موجود" };

  // السعر دايماً من القاعدة (product.price) مو من الفورم - الزبون ما
  // يقدر يحدد السعر بنفسه.
  const totalPrice = product.price * quantity;
  if (totalPrice > MAX_PAYMENT_AMOUNT) {
    return { error: "المبلغ الإجمالي كبير جداً" };
  }

  const [order] = await db
    .insert(orders)
    .values({
      userId: session.user.id,
      productId,
      quantity,
      totalPrice,
    })
    .returning();

  await db.insert(payments).values({
    userId: session.user.id,
    orderId: order.id,
    method: paymentMethod,
    amount: totalPrice,
    referenceNumber: paymentReference,
    senderPhone: paymentSenderPhone || null,
    status: "pending",
  });

  revalidatePath("/admin");
  return { success: true, orderId: order.id };
}

// ============================================================
// الدفع الإلكتروني (Zain Cash يدوي / حوالة اسيا)
// ============================================================

// ملاحظة: كانت هنا دالة submitPayment (دفعة مستقلة بدون طلب أو
// معاملة). انحذفت لأنه ماكو أي مكان بالواجهة يستدعيها، وكانت تقبل
// transactionId أي أحد بدون تحقق ملكية - يعني سطح هجوم مفتوح بلا
// أي فايدة. الدفع الحالي يصير عبر submitOrder أو submitTransaction.
// لو احتجتها بالمستقبل، لازم تتحقق إن المعاملة تعود للمستخدم الحالي.

export async function getPayments() {
  await requireAdminSession();
  return db.select().from(payments).orderBy(desc(payments.createdAt));
}

export async function reviewPayment(
  id: number,
  decision: "confirmed" | "rejected"
) {
  await requireAdminSession();

  // ملاحظة: reviewedBy كان يربط بـ user.id (Better Auth/Google) -
  // بعد فصل حساب الأدمن لنظام مستقل (باسوورد+TOTP)، ماكو صف أدمن
  // بجدول user، فنسيبه فاضي. الأدمن واحد بس بهالموقع، فمو مهم
  // نميّز "مين" راجع الدفعة.
  await db
    .update(payments)
    .set({
      status: decision,
      updatedAt: new Date(),
    })
    .where(eq(payments.id, id));

  revalidatePath("/admin");
}

// ============================================================
// إدارة حساب الأدمن نفسه (باسوورد + جلسة)
// ============================================================

export async function logoutAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  await destroyAdminSession(token);
  cookieStore.delete(ADMIN_SESSION_COOKIE);
  redirect("/admin/login");
}

// يغيّر باسوورد الأدمن ويطرد كل الجلسات المفتوحة فوراً (يشمل
// الجهاز الحالي نفسه - لازم يسجل دخول من جديد بعدها)
export async function changeAdminPasswordAction(formData: FormData) {
  await requireAdminSession();

  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "الباسوورد لازم يكون 8 أحرف على الأقل" };
  }
  if (newPassword !== confirmPassword) {
    return { error: "الباسووردين مو متطابقين" };
  }

  await changeAdminPassword(newPassword);

  return { success: true as const };
}

// ============================================================
// إشعارات داخل التطبيق (مو SMS) - الزبون المسجل بس يشوف إشعاراته
// ============================================================

// يرجّع إشعارات المستخدم الحالي (الأحدث أول) - يستخدمها جرس
// الإشعارات بالهيدر. يرجع array فاضي لو ماكو جلسة (بدل ما يرمي
// خطأ) لأن الهيدر يظهر بكل الصفحات وما نريد نكسره لو الجلسة انتهت
export async function getMyNotifications() {
  const session = await getServerSession();
  if (!session?.user?.id) return [];

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(30);
}

export async function getUnreadNotificationCount() {
  const session = await getServerSession();
  if (!session?.user?.id) return 0;

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(
      sql`${notifications.userId} = ${session.user.id} AND ${notifications.read} = false`
    );

  return row?.count ?? 0;
}

// يعلّم كل إشعارات المستخدم الحالي كمقروءة (يُستدعى لما يفتح الجرس)
export async function markNotificationsRead() {
  const session = await getServerSession();
  if (!session?.user?.id) return;

  await db
    .update(notifications)
    .set({ read: true })
    .where(
      sql`${notifications.userId} = ${session.user.id} AND ${notifications.read} = false`
    );

  revalidatePath("/", "layout");
}
<<<<<<< HEAD


// ============================================================
// إعدادات الواجهة (تبويب "الواجهة" بلوحة الأدمن)
// ============================================================

const DEFAULT_HOME_SECTIONS = [
  { key: "featured_products", title: "منتجات مميزة", visible: true },
  { key: "exclusive_ads", title: "عروض حصرية", visible: true },
];

export type HomeSection = { key: string; title: string; visible: boolean };

export async function getSiteSettings() {
  const [row] = await db.select().from(siteSettings).limit(1);
  if (!row) {
    // ما فيه صف بعد (مثلاً القاعدة انبنت قبل هذا التحديث ولا
    // انسوى INSERT الافتراضي) - نرجّع افتراضيات آمنة بدل ما ننفجر
    return {
      homeSections: DEFAULT_HOME_SECTIONS as HomeSection[],
      tiktokUrl: null as string | null,
      instagramUrl: null as string | null,
      telegramUrl: null as string | null,
      footerText: "حقوق النشر والطباعة محفوظة",
    };
  }

  let homeSections: HomeSection[];
  try {
    const parsed = JSON.parse(row.homeSections);
    // تحقق بسيط إن الشكل صحيح (مصفوفة)، وإلا نرجع للافتراضي بدل
    // ما نطلع بصفحة بيضاء لو صار خلل بالبيانات المخزنة
    homeSections = Array.isArray(parsed) ? parsed : DEFAULT_HOME_SECTIONS;
  } catch {
    homeSections = DEFAULT_HOME_SECTIONS;
  }

  return {
    homeSections,
    tiktokUrl: row.tiktokUrl,
    instagramUrl: row.instagramUrl,
    telegramUrl: row.telegramUrl,
    footerText: row.footerText,
  };
}

export async function updateSiteSettings(formData: FormData) {
  await requireAdminSession();

  const tiktokUrl = String(formData.get("tiktokUrl") ?? "").trim();
  const instagramUrl = String(formData.get("instagramUrl") ?? "").trim();
  const telegramUrl = String(formData.get("telegramUrl") ?? "").trim();
  const footerText = String(formData.get("footerText") ?? "").trim();
  const homeSectionsRaw = String(formData.get("homeSections") ?? "");

  // تحقق من طول الحقول (نفس مبدأ باقي النماذج بهذا الملف)
  if (
    tiktokUrl.length > 300 ||
    instagramUrl.length > 300 ||
    telegramUrl.length > 300 ||
    footerText.length > 200
  ) {
    return { error: "أحد الروابط أو النص طويل جداً" };
  }

  // تحقق من شكل homeSections قبل التخزين - لازم يكون مصفوفة كائنات
  // فيها key وtitle وvisible، وإلا الرئيسية تنكسر لكل الزوار
  let parsed: unknown;
  try {
    parsed = JSON.parse(homeSectionsRaw);
  } catch {
    return { error: "خطأ داخلي بترتيب الأقسام - حاول مرة ثانية" };
  }
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (item) =>
        item &&
        typeof item.key === "string" &&
        typeof item.title === "string" &&
        item.title.length <= 100 &&
        typeof item.visible === "boolean"
    )
  ) {
    return { error: "خطأ داخلي بترتيب الأقسام - حاول مرة ثانية" };
  }

  const [existing] = await db.select().from(siteSettings).limit(1);

  if (existing) {
    await db
      .update(siteSettings)
      .set({
        homeSections: JSON.stringify(parsed),
        tiktokUrl: tiktokUrl || null,
        instagramUrl: instagramUrl || null,
        telegramUrl: telegramUrl || null,
        footerText: footerText || null,
        updatedAt: new Date(),
      })
      .where(eq(siteSettings.id, 1));
  } else {
    await db.insert(siteSettings).values({
      id: 1,
      homeSections: JSON.stringify(parsed),
      tiktokUrl: tiktokUrl || null,
      instagramUrl: instagramUrl || null,
      telegramUrl: telegramUrl || null,
      footerText: footerText || null,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  return { success: true as const };
}

// ============================================================
// عداد الزيارات (تبويب "الزيارات" بلوحة الأدمن)
// ============================================================

// حد أقصى لطول الصفحة ومعرّف الزائر - يمنع تخزين نصوص ضخمة لو
// أحد استدعى الدالة مباشرة بقيم غريبة
const MAX_PATH_LENGTH = 200;
const MAX_VISITOR_ID_LENGTH = 100;

// تُستدعى من مكوّن تتبّع خفيف بكل صفحة (راجع components/page-tracker.tsx).
// ما تتطلب تسجيل دخول لأنها تسجل زيارات كل الزوار، بضمنهم من لم
// يسجلوا دخول. لا تُستخدم requireAdminSession هنا لأنها ليست
// عملية أدمن.
export async function recordPageView(path: string, visitorId: string) {
  if (
    !path ||
    !visitorId ||
    path.length > MAX_PATH_LENGTH ||
    visitorId.length > MAX_VISITOR_ID_LENGTH
  ) {
    return; // نتجاهل بصمت - هذا استدعاء تحليلي، ما يستحق رمي خطأ للزائر
  }

  // نستثني صفحات الأدمن نفسها من الإحصائيات - زيارات الأدمن وهو
  // يدير الموقع ما تمثل زوار حقيقيين وتضخّم الأرقام بدون فايدة
  if (path.startsWith("/admin")) return;

  await db.insert(pageViews).values({ path, visitorId });
}

export async function getVisitStats() {
  await requireAdminSession();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [todayCount, weekCount, monthCount, uniqueVisitors, topPages, dailyRows] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(pageViews)
        .where(sql`${pageViews.createdAt} >= ${todayStart}`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(pageViews)
        .where(sql`${pageViews.createdAt} >= ${weekStart}`),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(pageViews)
        .where(sql`${pageViews.createdAt} >= ${monthStart}`),
      db
        .select({ count: sql<number>`count(distinct ${pageViews.visitorId})::int` })
        .from(pageViews)
        .where(sql`${pageViews.createdAt} >= ${monthStart}`),
      db
        .select({ path: pageViews.path, count: sql<number>`count(*)::int` })
        .from(pageViews)
        .where(sql`${pageViews.createdAt} >= ${monthStart}`)
        .groupBy(pageViews.path)
        .orderBy(sql`count(*) desc`)
        .limit(5),
      db
        .select({
          day: sql<string>`to_char(${pageViews.createdAt}, 'YYYY-MM-DD')`,
          count: sql<number>`count(*)::int`,
        })
        .from(pageViews)
        .where(sql`${pageViews.createdAt} >= ${weekStart}`)
        .groupBy(sql`to_char(${pageViews.createdAt}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${pageViews.createdAt}, 'YYYY-MM-DD') asc`),
    ]);

  return {
    today: todayCount[0]?.count ?? 0,
    week: weekCount[0]?.count ?? 0,
    month: monthCount[0]?.count ?? 0,
    uniqueVisitorsMonth: uniqueVisitors[0]?.count ?? 0,
    topPages,
    daily: dailyRows,
  };
}

// ============================================================
// حاسبة المبيعات (تبويب "المبيعات" بلوحة الأدمن)
// ============================================================

export async function getSalesStats() {
  await requireAdminSession();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // نحسب بس الدفعات "confirmed" - المعلّقة لسه ما تأكدت، والمرفوضة
  // ملغاة، فحسابهم كمبيعات فعلية يعطي رقم مضلل لصاحب المكتبة
  const confirmed = eq(payments.status, "confirmed");

  const [todaySum, weekSum, monthSum, todayOrders, dailyRows] = await Promise.all([
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int` })
      .from(payments)
      .where(sql`${confirmed} and ${payments.createdAt} >= ${todayStart}`),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int` })
      .from(payments)
      .where(sql`${confirmed} and ${payments.createdAt} >= ${weekStart}`),
    db
      .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)::int` })
      .from(payments)
      .where(sql`${confirmed} and ${payments.createdAt} >= ${monthStart}`),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(payments)
      .where(sql`${confirmed} and ${payments.createdAt} >= ${todayStart}`),
    db
      .select({
        day: sql<string>`to_char(${payments.createdAt}, 'YYYY-MM-DD')`,
        total: sql<number>`coalesce(sum(${payments.amount}), 0)::int`,
      })
      .from(payments)
      .where(sql`${confirmed} and ${payments.createdAt} >= ${weekStart}`)
      .groupBy(sql`to_char(${payments.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${payments.createdAt}, 'YYYY-MM-DD') asc`),
  ]);

  const monthTotal = monthSum[0]?.total ?? 0;
  const monthOrdersCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(payments)
    .where(sql`${confirmed} and ${payments.createdAt} >= ${monthStart}`);
  const ordersCount = monthOrdersCount[0]?.count ?? 0;

  return {
    todayTotal: todaySum[0]?.total ?? 0,
    weekTotal: weekSum[0]?.total ?? 0,
    monthTotal,
    todayOrdersCount: todayOrders[0]?.count ?? 0,
    monthOrdersCount: ordersCount,
    // متوسط قيمة الطلب هذا الشهر - نتجنب القسمة على صفر
    avgOrderValue: ordersCount > 0 ? Math.round(monthTotal / ordersCount) : 0,
    daily: dailyRows,
  };
}
=======
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162
