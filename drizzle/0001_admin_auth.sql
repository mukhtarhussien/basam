-- ============================================================
-- المرحلة الثانية: نظام دخول الأدمن المستقل (باسوورد + TOTP)
-- ============================================================
-- هذا يستبدل آلية تحديد الأدمن القديمة (ADMIN_EMAILS عبر Google
-- OAuth). حساب الأدمن الحين صف واحد ثابت بجدول admin_auth، وجلساته
-- بجدول admin_sessions منفصل تماماً عن جدول session (Better Auth).
--
-- طريقة التشغيل: نفس طريقة 0000_init.sql (SQL Editor بلوحة Neon،
-- أو npm run db:push).
-- ============================================================

CREATE TABLE "admin_auth" (
  "id" integer PRIMARY KEY DEFAULT 1,
  "password_hash" text NOT NULL,
  "totp_secret" text,
  "totp_enabled" boolean NOT NULL DEFAULT false,
  "failed_attempts" integer NOT NULL DEFAULT 0,
  "locked_until" timestamp,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "admin_sessions" (
  "id" text PRIMARY KEY NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL
);

CREATE INDEX "idx_admin_sessions_token" ON "admin_sessions" ("token");

-- ملاحظة: جدول admin_auth يبدأ فاضي. أول تشغيل للسيرفر بعد هذا
-- المايغريشن (instrumentation.ts) بيلاحظ إنه فاضي ويسوي صف id=1
-- تلقائياً بباسوورد عشوائي، ويطبعه باللوجز مرة وحدة.
