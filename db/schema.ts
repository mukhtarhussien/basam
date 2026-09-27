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
  role: text("role").notNull().default("customer"),
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

export const adminAuth = pgTable("admin_auth", {
  id: integer("id").primaryKey().default(1),
  passwordHash: text("password_hash").notNull(),
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").notNull().default(false),
  failedAttempts: integer("failed_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
});

// ============================================================
// أنواع مشتركة (Enums)
// ============================================================

export const paymentMethodEnum = pgEnum("payment_method", [
  "zain_cash",
  "asia_hawala",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "confirmed",
  "rejected",
]);

export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "ready",
]);

export const productPlacementEnum = pgEnum("product_placement", [
  "ads",
  "home",
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
  fileType: text("file_type").notNull(),
  fileData: text("file_data").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body"),
  transactionId: integer("transaction_id").references(() => transactions.id, {
    onDelete: "set null",
  }),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: integer("price").notNull(),
  image: text("image"),
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
  amount: integer("amount").notNull(),
  referenceNumber: text("reference_number"),
  senderPhone: text("sender_phone"),
  providerTransactionId: text("provider_transaction_id"),
  providerRawResponse: text("provider_raw_response"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================================
// إعدادات الموقع - تتحكم فيها من لوحة الأدمن (تبويب "الواجهة")
// ============================================================

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
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

export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  visitorId: text("visitor_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
