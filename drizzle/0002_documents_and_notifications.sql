-- ============================================================
-- المرحلة 2 (تكملة): رفع مستندات المعاملة فعلياً + إشعارات داخل
-- التطبيق (بدون SMS)
-- ============================================================
-- هذا يعدّل جدول transaction_documents (كان موجود بالسكيما القديمة
-- لكن بلا أي دالة تكتب فيه فعلياً) عشان يخزن الملف كـ base64 داخل
-- القاعدة نفسها (بدون خدمة تخزين خارجية)، وينشئ جدول notifications
-- جديد.
--
-- طريقة التشغيل: نفس طريقة الميغريشنات السابقة (SQL Editor بلوحة
-- Neon، أو npm run db:push).
-- ============================================================

-- fileUrl صار fileData (base64) + fileType (MIME) - الجدول القديم
-- ماكان فيه صفوف فعلية أصلاً (ماكو دالة كتابة كانت تستخدمه)
ALTER TABLE "transaction_documents" RENAME COLUMN "file_url" TO "file_data";
ALTER TABLE "transaction_documents" ADD COLUMN "file_type" text NOT NULL DEFAULT 'application/octet-stream';
ALTER TABLE "transaction_documents" ALTER COLUMN "file_type" DROP DEFAULT;

CREATE TABLE "notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "body" text,
  "transaction_id" integer REFERENCES "transactions"("id") ON DELETE SET NULL,
  "read" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX "idx_notifications_user_id" ON "notifications" ("user_id");
