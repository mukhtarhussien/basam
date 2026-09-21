import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  pgEnum,
} from "drizzle-orm/pg-core";

// ============================================================
// جداول Better Auth (لا تغيّر أسماء الحقول - Better Auth يتوقعها بهذا الشكل)
// ============================================================

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  // حقل قديم غير مستخدم فعلياً بعد المرحلة 2 - كل مستخدم يسجل
  // دخول (Google أو رقم موبايل) يبقى "customer". حساب الأدمن
  // الحين نظام مستقل تماماً (راجع جدول admin_auth تحت)
  role: text("role").notNull().default("customer"),
  // رقم الموبايل + حالة التحقق منه - يستخدمهم plugin تسجيل الدخول
  // برقم الموبايل (راجع lib/auth.ts، plugin: phoneNumber)
  phoneNumber: text("phone_number").unique(),
  phoneNumberVerified: boolean("phone_number_verified").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// نظام دخول الأدمن المستقل (باسوورد + TOTP)
// ============================================================
// منفصل تماماً عن Better Auth/Google. جدول adminAuth فيه صف واحد
// بس دايماً (id ثابت = 1) يمثّل "حساب الأدمن" الوحيد بالموقع.

export const adminAuth = pgTable("admin_auth", {
  id: integer("id").primaryKey().default(1),
  // هاش الباسوورد (bcrypt) - يتولد عشوائياً أول تشغيل سيرفر،
  // أو يتغيّر يدوياً من لوحة التحكم (راجع app/actions.ts)
  passwordHash: text("password_hash").notNull(),
  // سر TOTP (raw base32) - يتولد أول ما الأدمن يفعّل TOTP من
  // صفحة الإعداد، ويُستخدم للتحقق من كود Google Authenticator
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  // محاولات الدخول الفاشلة المتتالية (باسوورد أو TOTP غلط) -
  // تتصفر عند نجاح الدخول. بعد 5 محاولات يُقفل الدخول مؤقتاً
  // (راجع lockedUntil تحت)
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// جلسات الأدمن - منفصلة عن جدول session (اللي لـ Better Auth).
// أي تغيير بالباسوورد يمسح كل الصفوف هنا فيطرد كل الجلسات المفتوحة.
export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ============================================================
// أنواع مشتركة (Enums)
// ============================================================

// طريقة الدفع: زين كاش أو حوالة اسيا
export const paymentMethodEnum = pgEnum("payment_method", [
  "zain_cash",
  "asia_hawala",
]);

// حالة عملية الدفع
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending", // بانتظار المراجعة (للحوالة اليدوية) أو تأكيد المزود
  "confirmed", // تم التأكد من الدفع (يدوياً من الأدمن أو تلقائياً من API)
  "rejected", // رفض الأدمن الدفع (رقم مرجعي خاطئ مثلاً)
]);

// حالة المعاملة (طلب خدمة)
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "ready",
]);

// وين يظهر المنتج: بصفحة المتجر يظهر دايماً، وهذي القيم تتحكم
// بظهوره الإضافي بأماكن ثانية (الإعلانات و/أو الصفحة الرئيسية)
export const productPlacementEnum = pgEnum("product_placement", [
  "ads", // يظهر بصفحة /ads
  "home", // يظهر بالصفحة الرئيسية
]);

// ============================================================
// جداول التطبيق
// ============================================================

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  type: text("type").notNull(),
  notes: text("notes"),
  status: transactionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactionDocuments = pgTable("transaction_documents", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  // نوع الملف (MIME) - يحتاجه المتصفح عشان يعرض/ينزّل الملف صحيح
  fileType: text("file_type").notNull(),
  // محتوى الملف نفسه، مخزّن base64 داخل القاعدة (ماكو تخزين ملفات
  // خارجي مربوط بالمشروع لحد الحين - راجع ملاحظة الحجم بالفورم
  // اللي يرفع الملف: app/transactions/transaction-form.tsx)
  fileData: text("file_data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============================================================
// إشعارات داخل التطبيق (مو SMS - تظهر بس لما المستخدم يسجل دخول
// ويفتح جرس الإشعارات بالهيدر)
// ============================================================
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  // يربط الإشعار بمعاملة معيّنة (اختياري - يفيد لو حبينا نضيف رابط
  // "شوف المعاملة" بالمستقبل)
  transactionId: integer("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(), // بالدينار العراقي، عدد صحيح بدون فواصل
  image: text("image"),
  // إعدادات متقدمة: وين يظهر المنتج غير صفحة المتجر (اختياري،
  // يقدر يكون بالإعلانات و/أو الرئيسية سوا، أو ولا مكان)
  placement: productPlacementEnum("placement").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  excerpt: text("excerpt"),
  image: text("image"),
  featured: boolean("featured").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const ads = pgTable("ads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  image: text("image"),
  duration: text("duration").notNull().default("أسبوع"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  productId: integer("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: integer("total_price").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// عمليات الدفع - تُربط بطلب (order) أو معاملة (transaction)
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  transactionId: integer("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  method: paymentMethodEnum("method").notNull(),
  amount: integer("amount").notNull(), // بالدينار العراقي

  // للدفع اليدوي (حوالة اسيا أو زين كاش بدون API): الزبون يدخل رقم مرجعي
  referenceNumber: text("reference_number"),
  senderPhone: text("sender_phone"),

  // لربط Zain Cash API الحقيقي لاحقاً (فاضية حالياً لحد ما تتفعل)
  providerTransactionId: text("provider_transaction_id"),
  providerRawResponse: text("provider_raw_response"),

  status: paymentStatusEnum("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
<<<<<<< HEAD

// ============================================================
// إعدادات الموقع - تتحكم فيها من لوحة الأدمن (تبويب "الواجهة")
// ============================================================
// صف واحد فقط (id = 1) يخزن كل إعدادات الرئيسية: ترتيب الأقسام،
// إظهار/إخفاء كل قسم، عناوينها، وروابط التواصل الاجتماعي.
// نخزن "homeSections" كنص JSON بدل عمود لكل قسم، عشان نقدر نضيف
// أقسام جديدة بالمستقبل بدون migration جديد كل مرة.
export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  // مصفوفة JSON: [{ key: "featured_products", visible: true, order: 0, title: "منتجات مميزة" }, ...]
  homeSections: text("home_sections").notNull(),
  tiktokUrl: text("tiktok_url"),
  instagramUrl: text("instagram_url"),
  telegramUrl: text("telegram_url"),
  footerText: text("footer_text"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// زيارات الموقع - لعداد الزيارات المعروض بلوحة الأدمن
// ============================================================
// سطر واحد لكل زيارة صفحة. ما نخزن أي شي يعرّف الشخص (لا IP ولا
// بريد): بس الصفحة، الوقت، ومعرّف مجهول عشوائي (visitorId) يتولد
// بمتصفح الزائر نفسه (كوكي بسيط) عشان نميّز "زائر فريد" عن "نفس
// الزائر رجع 3 مرات" بدون معرفة هويته.
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  visitorId: text("visitor_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
=======
>>>>>>> 2f8048a707ef51b6661a94b9d626885f7900c162
