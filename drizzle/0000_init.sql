-- ============================================================
-- تعريف قاعدة بيانات نيون (Neon Postgres) - مشروع basam
-- ============================================================
-- هذا الملف يبني كل الجداول من الصفر. شغّله مرة وحدة على قاعدة
-- بيانات فاضية (أو استخدم drizzle-kit push، راجع الملاحظة بالأسفل).
--
-- طريقة التشغيل اليدوي:
--   1. افتح لوحة تحكم Neon > SQL Editor لمشروعك
--   2. الصق محتوى هذا الملف كامل وشغّله
--
-- أو عبر drizzle-kit (يحتاج DATABASE_URL بملف .env.local):
--   npm run db:push
-- ============================================================

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------

CREATE TYPE "payment_method" AS ENUM ('zain_cash', 'asia_hawala');

CREATE TYPE "payment_status" AS ENUM ('pending', 'confirmed', 'rejected');

CREATE TYPE "transaction_status" AS ENUM ('pending', 'ready');

-- وين يظهر المنتج إضافياً (غير صفحة المتجر): الإعلانات و/أو الرئيسية
CREATE TYPE "product_placement" AS ENUM ('ads', 'home');

-- ------------------------------------------------------------
-- جداول Better Auth (لا تغيّر أسماء الأعمدة - Better Auth يتوقعها بهذا الشكل)
-- ------------------------------------------------------------

CREATE TABLE "user" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "email_verified" boolean NOT NULL DEFAULT false,
  "image" text,
  "role" text NOT NULL DEFAULT 'customer',
  "phone_number" text UNIQUE,
  "phone_number_verified" boolean DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "session" (
  "id" text PRIMARY KEY NOT NULL,
  "expires_at" timestamp NOT NULL,
  "token" text NOT NULL UNIQUE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  "ip_address" text,
  "user_agent" text,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE TABLE "account" (
  "id" text PRIMARY KEY NOT NULL,
  "account_id" text NOT NULL,
  "provider_id" text NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "access_token" text,
  "refresh_token" text,
  "id_token" text,
  "access_token_expires_at" timestamp,
  "refresh_token_expires_at" timestamp,
  "scope" text,
  "password" text,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "verification" (
  "id" text PRIMARY KEY NOT NULL,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- ------------------------------------------------------------
-- جداول التطبيق
-- ------------------------------------------------------------

CREATE TABLE "transactions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "full_name" text NOT NULL,
  "phone" text NOT NULL,
  "type" text NOT NULL,
  "notes" text,
  "status" transaction_status NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "transaction_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "transaction_id" integer NOT NULL REFERENCES "transactions"("id") ON DELETE CASCADE,
  "file_name" text NOT NULL,
  "file_url" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "price" integer NOT NULL,
  "image" text,
  "placement" product_placement[] NOT NULL DEFAULT '{}',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "news" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "excerpt" text,
  "image" text,
  "featured" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "ads" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "description" text,
  "image" text,
  "duration" text NOT NULL DEFAULT 'أسبوع',
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "product_id" integer REFERENCES "products"("id") ON DELETE SET NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  "total_price" integer NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE TABLE "payments" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "user"("id") ON DELETE SET NULL,
  "order_id" integer REFERENCES "orders"("id") ON DELETE SET NULL,
  "transaction_id" integer REFERENCES "transactions"("id") ON DELETE SET NULL,
  "method" payment_method NOT NULL,
  "amount" integer NOT NULL,
  "reference_number" text,
  "sender_phone" text,
  "provider_transaction_id" text,
  "provider_raw_response" text,
  "status" payment_status NOT NULL DEFAULT 'pending',
  "reviewed_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- فهارس تساعد بالأداء على الاستعلامات المتكررة
-- ------------------------------------------------------------

CREATE INDEX "idx_transactions_status" ON "transactions" ("status");
CREATE INDEX "idx_payments_status" ON "payments" ("status");
CREATE INDEX "idx_orders_product_id" ON "orders" ("product_id");
