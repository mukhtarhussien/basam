import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { phoneNumber } from "better-auth/plugins";
import { db } from "@/db";
import * as schema from "@/db/schema";

// ============================================================
// إرسال كود OTP برقم الموبايل
// ============================================================
// تغيير أمني: كان الكود يُطبع باللوجز حتى بالإنتاج، يعني أي شخص
// يقرأ لوجز Vercel يقدر يدخل بحساب أي رقم. الحين:
//
//  - بالتطوير (NODE_ENV !== "production"): يطبع الكود بالـ console
//    عشان تجرب الفلو.
//  - بالإنتاج: الدخول برقم الموبايل معطّل تماماً (يرمي خطأ) ما لم
//    تفعّل PHONE_LOGIN_ENABLED=true وتربط مزود SMS حقيقي هنا.
//    الكود ما ينطبع باللوجز أبداً بالإنتاج.
//
// لما يجهز حساب SMS، حط طلب الإرسال الفعلي مكان TODO تحت.
export const PHONE_LOGIN_ENABLED =
  process.env.NODE_ENV !== "production" ||
  process.env.PHONE_LOGIN_ENABLED === "true";

async function sendPhoneOtp(phoneNumber: string, code: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[OTP - تطوير فقط] الكود ${code} إلى ${phoneNumber}`);
    return;
  }

  if (!PHONE_LOGIN_ENABLED) {
    throw new Error("PHONE_LOGIN_DISABLED");
  }

  // TODO: اربط هنا مزود SMS حقيقي (Twilio أو مزود عراقي)، مثال تقريبي:
  // const res = await fetch("https://api.your-sms-provider.com/send", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //     Authorization: `Bearer ${process.env.SMS_API_KEY}`,
  //   },
  //   body: JSON.stringify({ to: phoneNumber, message: `كود التحقق: ${code}` }),
  // });
  // if (!res.ok) throw new Error("SMS_SEND_FAILED");
  //
  // مهم: لا تطبع `code` بأي console.log هنا.
  throw new Error("SMS_PROVIDER_NOT_CONFIGURED");
}

// ملاحظة: آلية تحديد الأدمن عبر ADMIN_EMAILS اتشالت من هنا.
// حساب الأدمن الحين نظام مستقل تماماً (باسوورد + TOTP) بدون أي
// علاقة بتسجيل دخول Google - راجع lib/admin-auth.ts. حقل role
// بجدول user ضل موجود بالـ schema لكنه غير مستخدم فعلياً بعد الآن؛
// كل مستخدم يسجل دخول بجوجل أو رقم موبايل يصير "customer" عادي.

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  plugins: [
    // تسجيل الدخول برقم الموبايل + كود OTP (بجانب Google، ما يبدله)
    phoneNumber({
      sendOTP: async ({ phoneNumber, code }) => {
        await sendPhoneOtp(phoneNumber, code);
      },
      // أول ما يتحقق الكود لأول مرة، ينشئ حساب مستخدم جديد تلقائياً
      signUpOnVerification: {
        getTempEmail: (phoneNumber) => `${phoneNumber}@phone.basam.local`,
        getTempName: (phoneNumber) => phoneNumber,
      },
    }),
  ],

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false, // المستخدم ما يقدر يغيّر دوره بنفسه من الفرونت اند
      },
    },
  },

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

export type Session = typeof auth.$Infer.Session;
