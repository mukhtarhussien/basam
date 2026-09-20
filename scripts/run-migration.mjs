// يشغّل كل ملفات drizzle/*.sql بالترتيب على قاعدة بيانات نيون
// المحددة بـ DATABASE_URL، ويتتبع اللي اشتغل منها بجدول خاص
// (_app_migrations) عشان ما يعيد تشغيل ملف مرتين.
//
// تشغيل: npm run db:migrate:sql
//
// كان السكربت القديم يشغّل 0000_init.sql بس ويتجاهل 0001 و0002،
// وهذا كان يخلي جداول الأدمن والإشعارات ما تنبني أبداً.
//
// آمن للتشغيل أكثر من مرة: الملفات اللي اشتغلت قبل تنتخطى.
// كل ملف يشتغل داخل transaction: لو فشل شي بنص الملف، يتراجع
// كله ولا يبقى نص جداول.
//
// ملاحظة: يستخدم مكتبة "pg" (اتصال SQL عادي) بدل درايفر نيون
// الخفيف، لأن تشغيل ملف SQL كامل بعدة جمل يحتاج اتصال حقيقي.
// باقي المشروع يستمر يستخدم درايفر نيون (راجع db/index.ts).
//
// مهم: لا تستخدم db:push مع هذا السكربت. اختار طريقة وحدة بس.

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Client } from "pg";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "..", ".env.local") });

if (!process.env.DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL غير موجود. أضفه بملف .env.local (راجع .env.example)"
  );
  process.exit(1);
}

const migrationsDir = join(__dirname, "..", "drizzle");

// نأخذ بس الملفات اللي اسمها يبدأ برقم (0000_..., 0001_...) ونرتبها
// أبجدياً - الترقيم بأربع خانات يضمن الترتيب الصحيح
const files = readdirSync(migrationsDir)
  .filter((f) => /^\d{4}_.+\.sql$/.test(f))
  .sort();

if (files.length === 0) {
  console.error("❌ ما لقيت أي ملف migration بمجلد drizzle/");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS "_app_migrations" (
      "name" text PRIMARY KEY,
      "applied_at" timestamp NOT NULL DEFAULT now()
    )
  `);

  const { rows } = await client.query(`SELECT "name" FROM "_app_migrations"`);
  const applied = new Set(rows.map((r) => r.name));

  // حالة خاصة: قاعدة بنيت قبل هذا السكربت (يدوياً من SQL Editor)
  // فيها جداول بس بدون سجل. لو جدول "user" موجود ولا يوجد أي سجل،
  // ما نعيد تشغيل 0000 (بينفجر لأن الجداول موجودة). نتوقف ونوضح.
  if (applied.size === 0) {
    const { rows: existing } = await client.query(
      `SELECT to_regclass('public."user"') AS t`
    );
    if (existing[0].t !== null) {
      console.error(
        "❌ القاعدة فيها جداول موجودة أصلاً بدون سجل migrations.\n" +
          "   يعني انبنت يدوياً (SQL Editor أو db:push).\n" +
          "   ما أقدر أعرف أي ملفات اشتغلت، فما راح أشغّل شي عشان ما أخرّب.\n" +
          "   الحل: شغّل الملفات الناقصة يدوياً من SQL Editor، أو استخدم\n" +
          "   قاعدة فاضية جديدة."
      );
      process.exitCode = 1;
    }
  }

  if (process.exitCode !== 1) {
    const pending = files.filter((f) => !applied.has(f));

    if (pending.length === 0) {
      console.log("✅ القاعدة محدّثة، ماكو migrations جديدة");
    }

    for (const file of pending) {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      console.log(`⏳ تشغيل ${file} ...`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT INTO "_app_migrations" ("name") VALUES ($1)`,
          [file]
        );
        await client.query("COMMIT");
        console.log(`✅ ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        console.error(`❌ فشل ${file} - تراجع عنه كامل:`);
        console.error(err.message ?? err);
        process.exitCode = 1;
        break; // لا نكمل للملف التالي لو السابق فشل
      }
    }
  }
} catch (err) {
  console.error("❌ صار خطأ بالاتصال بالقاعدة:");
  console.error(err.message ?? err);
  process.exitCode = 1;
} finally {
  await client.end();
}
