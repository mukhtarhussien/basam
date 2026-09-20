import "server-only";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import { db } from "@/db";
import { adminAuth, adminSessions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

// ============================================================
// إعدادات عامة
// ============================================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 دقيقة (كانت دقيقة وحدة = ضعيف ضد التخمين)
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 يوم
export const ADMIN_SESSION_COOKIE = "basam_admin_session";

// ============================================================
// تهيئة أول تشغيل: الباسوورد الأولي يجي من متغير بيئة
// ============================================================
// يُستدعى من نقطة دخول السيرفر (راجع instrumentation.ts).
//
// تغيير أمني مهم: الباسوورد الأولي ما يتولد ولا يتطبع باللوجز بعد
// الآن. كان هذا ثغرة: أي شخص يقدر يشوف لوجز Vercel كان يقدر يسبق
// صاحب الموقع ويدخل ويربط Authenticator تبعه هو.
//
// الحين: لازم تحط ADMIN_INITIAL_PASSWORD بمتغيرات Vercel (12 حرف
// على الأقل). لو الجدول فاضي ويوجد المتغير، ننشئ الصف بهذا الباسوورد.
// لو الجدول فاضي وماكو متغير، ما ننشئ شي ونسجل تحذير واضح - أفضل
// من إننا نولد باسوورد عشوائي ونطبعه.
// لو الصف موجود مسبقاً، ما نلمسه أبداً (حتى لو المتغير موجود) -
// ما نبدل باسوورد أحد من متغير البيئة بعد أول تشغيل.
const MIN_INITIAL_PASSWORD_LENGTH = 12;

export async function ensureAdminAuthInitialized() {
  const existing = await db.select().from(adminAuth).limit(1);
  if (existing.length > 0) return;

  const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

  if (!initialPassword) {
    // eslint-disable-next-line no-console
    console.warn(
      "[admin-auth] ADMIN_INITIAL_PASSWORD غير موجود - ما انشأ حساب الأدمن. " +
        "أضفه بمتغيرات Vercel (12 حرف على الأقل) ثم اعمل Redeploy."
    );
    return;
  }

  if (initialPassword.length < MIN_INITIAL_PASSWORD_LENGTH) {
    // eslint-disable-next-line no-console
    console.error(
      `[admin-auth] ADMIN_INITIAL_PASSWORD قصير (لازم ${MIN_INITIAL_PASSWORD_LENGTH} حرف على الأقل) - ما انشأ حساب الأدمن.`
    );
    return;
  }

  const passwordHash = await bcrypt.hash(initialPassword, 12);

  // onConflictDoNothing: لو سيرفرين اشتغلوا بنفس اللحظة (سباق)
  // ما ينفجر واحد منهم بخطأ مفتاح مكرر
  await db
    .insert(adminAuth)
    .values({ id: 1, passwordHash })
    .onConflictDoNothing();

  // eslint-disable-next-line no-console
  console.log(
    "[admin-auth] انشأ حساب الأدمن من ADMIN_INITIAL_PASSWORD. " +
      "ادخل /admin/login وفعّل Authenticator فوراً، وبعدها احذف المتغير من Vercel."
  );
}

// ============================================================
// حالة القفل المؤقت
// ============================================================

async function getAuthRow() {
  const [row] = await db.select().from(adminAuth).where(eq(adminAuth.id, 1));
  return row ?? null;
}

export async function getLockoutStatus() {
  const row = await getAuthRow();
  if (!row?.lockedUntil) return { locked: false as const };
  const now = new Date();
  if (row.lockedUntil <= now) return { locked: false as const };
  const secondsLeft = Math.ceil(
    (row.lockedUntil.getTime() - now.getTime()) / 1000
  );
  return { locked: true as const, secondsLeft };
}

async function registerFailedAttempt() {
  // تحديث ذرّي (atomic) بجملة SQL وحدة: القاعدة نفسها تزيد العداد.
  // كان الكود القديم يقرأ العداد ثم يكتب القيمة الجديدة (قراءة ثم
  // كتابة)، فلو أحد أرسل 20 طلب متوازي كلهم يقرأون 0 ويكتبون 1،
  // ويتجاوز حد المحاولات كله. هنا القاعدة تزيد العداد فعلياً.
  //
  // وقت القفل نحسبه بالتطبيق (new Date) مو NOW() بالقاعدة: عمود
  // locked_until نوعه timestamp بدون timezone، وباقي الكود (getLockoutStatus)
  // يقارن مع new Date()، فنستخدم نفس مصدر الوقت عشان ما يصير انحراف.
  const lockUntil = new Date(Date.now() + LOCKOUT_MS);
  const limit = MAX_FAILED_ATTEMPTS;

  await db
    .update(adminAuth)
    .set({
      failedAttempts: sql`CASE WHEN ${adminAuth.failedAttempts} + 1 >= ${limit}::int THEN 0 ELSE ${adminAuth.failedAttempts} + 1 END`,
      lockedUntil: sql`CASE WHEN ${adminAuth.failedAttempts} + 1 >= ${limit}::int THEN ${lockUntil.toISOString()}::timestamp ELSE ${adminAuth.lockedUntil} END`,
      updatedAt: new Date(),
    })
    .where(eq(adminAuth.id, 1));
}

async function clearFailedAttempts() {
  await db
    .update(adminAuth)
    .set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() })
    .where(eq(adminAuth.id, 1));
}

// ============================================================
// التحقق من الباسوورد (الخطوة 1)
// ============================================================

export async function verifyAdminPassword(password: string) {
  const lockout = await getLockoutStatus();
  if (lockout.locked) {
    return { ok: false as const, reason: "locked" as const, secondsLeft: lockout.secondsLeft };
  }

  const row = await getAuthRow();
  if (!row) {
    return { ok: false as const, reason: "not_initialized" as const };
  }

  const valid = await bcrypt.compare(password, row.passwordHash);
  if (!valid) {
    await registerFailedAttempt();
    return { ok: false as const, reason: "invalid" as const };
  }

  // الباسوورد صح - ما نصفر المحاولات هنا لسه، لأن الخطوة الثانية
  // (TOTP) لازم تنجح هي كمان قبل ما نعتبر الدخول كامل
  return { ok: true as const, totpEnabled: row.totpEnabled };
}

// ============================================================
// التحقق من كود TOTP (الخطوة 2)
// ============================================================

export async function verifyAdminTotp(code: string) {
  const lockout = await getLockoutStatus();
  if (lockout.locked) {
    return { ok: false as const, reason: "locked" as const, secondsLeft: lockout.secondsLeft };
  }

  const row = await getAuthRow();
  if (!row?.totpSecret || !row.totpEnabled) {
    return { ok: false as const, reason: "not_enabled" as const };
  }

  const totp = new OTPAuth.TOTP({
    issuer: "مكتبة سيد بسام (تجريبي)",
    label: "admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(row.totpSecret),
  });

  // نسمح بانحراف نافذة وحدة (30 ثانية) لفرق الساعة البسيط بين
  // موبايل الأدمن والسيرفر
  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    await registerFailedAttempt();
    return { ok: false as const, reason: "invalid" as const };
  }

  await clearFailedAttempts();
  return { ok: true as const };
}

// ============================================================
// إعداد TOTP لأول مرة (يولّد سر جديد + رابط QR)
// ============================================================

export async function generateTotpSetup() {
  // حماية أساسية: لو TOTP مفعّل أصلاً، ممنوع نولّد سر جديد. بدون هذا
  // الفحص، أي جلسة أدمن صالحة (حتى مسروقة) تقدر تستبدل الـ
  // Authenticator بتاعها وتقفل صاحب الموقع برا.
  // (لو ضاع موبايلك: الحل يدوي من قاعدة البيانات - راجع دليل الإعداد)
  const current = await getAuthRow();
  if (current?.totpEnabled) {
    return { ok: false as const, reason: "already_enabled" as const };
  }

  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: "مكتبة سيد بسام (تجريبي)",
    label: "admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  // نخزن السر بس لسه ما نفعّل totpEnabled لين يتأكد الأدمن بإدخال
  // كود صحيح مرة وحدة (يمنع قفل نفسه برا لو صور QR غلط)
  await db
    .update(adminAuth)
    .set({ totpSecret: secret.base32, totpEnabled: false, updatedAt: new Date() })
    .where(eq(adminAuth.id, 1));

  return { ok: true as const, secret: secret.base32, uri: totp.toString() };
}

export async function confirmTotpSetup(code: string) {
  const lockout = await getLockoutStatus();
  if (lockout.locked) {
    return { ok: false as const, reason: "locked" as const, secondsLeft: lockout.secondsLeft };
  }

  const row = await getAuthRow();
  if (!row?.totpSecret) {
    return { ok: false as const, reason: "not_started" as const };
  }
  if (row.totpEnabled) {
    return { ok: false as const, reason: "already_enabled" as const };
  }

  const totp = new OTPAuth.TOTP({
    issuer: "مكتبة سيد بسام (تجريبي)",
    label: "admin",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(row.totpSecret),
  });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    // نسجل المحاولة الفاشلة (كان ناقص - كان تخمين الكود بالإعداد
    // بلا حد أبداً)
    await registerFailedAttempt();
    return { ok: false as const, reason: "invalid" as const };
  }

  await clearFailedAttempts();
  await db
    .update(adminAuth)
    .set({ totpEnabled: true, updatedAt: new Date() })
    .where(eq(adminAuth.id, 1));

  return { ok: true as const };
}

// ============================================================
// تغيير الباسوورد (من داخل لوحة التحكم) - يطرد كل الجلسات
// ============================================================

export async function changeAdminPassword(newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db
    .update(adminAuth)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(adminAuth.id, 1));

  // يطرد كل الجلسات المفتوحة - يشمل الجهاز الحالي، فلازم يسجل
  // دخول من جديد بعد التغيير مباشرة
  await db.delete(adminSessions);
}

// ============================================================
// إدارة الجلسات
// ============================================================

export async function createAdminSession() {
  const token = randomBytes(32).toString("hex");
  const id = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(adminSessions).values({ id, token, expiresAt });

  return { token, expiresAt };
}

export async function verifyAdminSession(token: string | undefined) {
  if (!token) return false;

  const [row] = await db
    .select()
    .from(adminSessions)
    .where(eq(adminSessions.token, token));

  if (!row) return false;
  if (row.expiresAt <= new Date()) {
    await db.delete(adminSessions).where(eq(adminSessions.id, row.id));
    return false;
  }

  return true;
}

export async function destroyAdminSession(token: string | undefined) {
  if (!token) return;
  await db.delete(adminSessions).where(eq(adminSessions.token, token));
}

// ============================================================
// حماية الـ server actions
// ============================================================
// ملاحظة مهمة: layout.tsx يحمي "الصفحات" بس. الـ server actions
// تنستدعى مباشرة (بدون ما تمر بالـ layout)، فلازم كل action تتحقق
// بنفسها. وكان الفحص القديم يتأكد من "وجود جلسة" فقط - وجلسة
// المرحلة الأولى (بعد الباسوورد وقبل تفعيل TOTP) كانت تعدّي، يعني
// أي حد يعرف الباسوورد كان يقدر يستدعي deleteProduct أو
// reviewPayment مباشرة بدون TOTP أبداً.
//
// الحين: requireAdminSession() (المستخدمة بكل عمليات الأدمن)
// ترفض لو TOTP مو مفعّل. وبس requireAdminSessionForTotpSetup()
// (المستخدمة بصفحة إعداد TOTP وحدها) تقبل جلسة بدون TOTP.

async function readAdminSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
}

// لكل عمليات الأدمن العادية - يرمي خطأ لو ماكو جلسة صالحة أو لو
// TOTP لسه مو مفعّل
export async function requireAdminSession() {
  const token = await readAdminSessionToken();
  const valid = await verifyAdminSession(token);
  if (!valid) {
    throw new Error("UNAUTHORIZED");
  }

  const row = await getAuthRow();
  if (!row?.totpEnabled) {
    throw new Error("TOTP_NOT_ENABLED");
  }
}

// خاص بصفحة إعداد TOTP فقط - يقبل جلسة صالحة حتى لو TOTP مو مفعّل
// (لأن هذا بالضبط الوضع اللي المفروض تشتغل فيه الصفحة). لا تستخدمها
// بأي مكان ثاني.
export async function requireAdminSessionForTotpSetup() {
  const token = await readAdminSessionToken();
  const valid = await verifyAdminSession(token);
  if (!valid) {
    throw new Error("UNAUTHORIZED");
  }
}
