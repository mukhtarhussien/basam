-- ============================================================
-- إعدادات الواجهة + عداد الزيارات
-- ============================================================
-- شغّل هذا الملف بعد 0000 و0001 و0002، بنفس الطريقة (SQL Editor
-- بـ Neon أو npm run db:migrate:sql)

CREATE TABLE "site_settings" (
  "id" integer PRIMARY KEY DEFAULT 1,
  "home_sections" text NOT NULL,
  "tiktok_url" text,
  "instagram_url" text,
  "telegram_url" text,
  "footer_text" text,
  "updated_at" timestamp NOT NULL DEFAULT now()
);

-- الصف الافتراضي: نفس ترتيب وحالة الأقسام اللي بالكود الحالي،
-- عشان الموقع ما يتغيّر شكله فجأة بعد هذا التحديث. الأدمن يقدر
-- يغيّرها بعدين من لوحة التحكم.
INSERT INTO "site_settings" ("id", "home_sections", "tiktok_url", "telegram_url", "footer_text")
VALUES (
  1,
  '[
    {"key":"featured_products","title":"منتجات مميزة","visible":true},
    {"key":"exclusive_ads","title":"عروض حصرية","visible":true}
  ]',
  'https://www.tiktok.com/@basam10097',
  'https://t.me/Hurriya9',
  'حقوق النشر والطباعة محفوظة'
);

CREATE TABLE "page_views" (
  "id" serial PRIMARY KEY NOT NULL,
  "path" text NOT NULL,
  "visitor_id" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "idx_page_views_created_at" ON "page_views" ("created_at");
CREATE INDEX "idx_page_views_path" ON "page_views" ("path");
