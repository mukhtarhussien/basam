"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn, Phone, ShieldCheck } from "lucide-react";
import { signIn, authClient } from "@/lib/auth-client";

// صفحة تسجيل الدخول العامة (لكل زوار الموقع، غير صفحة /admin/login
// الخاصة بالأدمن فقط). تدعم طريقتين:
//  1. تسجيل دخول بحساب Google (نفس اللي كان موجود سابقاً بالأدمن)
//  2. تسجيل دخول برقم الموبايل + كود تحقق (OTP) عبر SMS
//
// بعد تسجيل الدخول، يرجّع المستخدم إلى الصفحة اللي كان يحاول
// يدخلها أصلاً (؟next=...) بفضل middleware.ts.
//
// الدخول برقم الموبايل يظهر بس بالتطوير، أو بالإنتاج لو حطيت
// NEXT_PUBLIC_PHONE_LOGIN_ENABLED=true (بعد ما تربط مزود SMS حقيقي
// بـ lib/auth.ts). بدون هذا، بالإنتاج ما فيه SMS يوصل، فنخفي الزر
// بدل ما الزبون يضغط وتطلع له رسالة خطأ.
const PHONE_LOGIN_VISIBLE =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_PHONE_LOGIN_ENABLED === "true";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"choose" | "phone-enter" | "phone-verify">(
    "choose"
  );
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    await signIn.social({ provider: "google", callbackURL: next });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const normalized = phone.trim();
    if (!normalized) {
      setError("عبّي رقم الموبايل");
      return;
    }

    setLoading(true);
    const { error: sendError } = await authClient.phoneNumber.sendOtp({
      phoneNumber: normalized,
    });
    setLoading(false);

    if (sendError) {
      setError(sendError.message || "ما قدرنا نرسل الكود، جرب مرة ثانية");
      return;
    }

    setMode("phone-verify");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("عبّي كود التحقق");
      return;
    }

    setLoading(true);
    const { error: verifyError } = await authClient.phoneNumber.verify({
      phoneNumber: phone.trim(),
      code: code.trim(),
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message || "الكود غلط أو منتهي، جرب مرة ثانية");
      return;
    }

    router.push(next);
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 gap-6">
      <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center">
        {mode === "choose" ? (
          <LogIn className="w-7 h-7" />
        ) : (
          <Phone className="w-7 h-7" />
        )}
      </div>

      <div className="text-center">
        <h1 className="text-xl font-bold">تسجيل الدخول</h1>
        <p className="text-sm opacity-60 mt-1">
          اهلا بك، قم بتسجيل الدخول لاستخدام منصتنا!
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2 w-full max-w-xs text-center">
          {error}
        </p>
      )}

      {mode === "choose" && (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-accent text-white rounded-lg p-3 font-semibold disabled:opacity-60"
          >
            {loading ? "جاري الدخول..." : "دخول بحساب Google"}
          </button>

          {PHONE_LOGIN_VISIBLE && (
            <>
              <div className="flex items-center gap-2 text-xs opacity-50">
                <span className="flex-1 h-px bg-border" />
                أو
                <span className="flex-1 h-px bg-border" />
              </div>

              <button
                onClick={() => setMode("phone-enter")}
                disabled={loading}
                className="flex items-center justify-center gap-2 bg-surface border border-border rounded-lg p-3 font-semibold disabled:opacity-60"
              >
                <Phone className="w-4 h-4" />
                دخول برقم الموبايل
              </button>
            </>
          )}
        </div>
      )}

      {mode === "phone-enter" && (
        <form
          onSubmit={handleSendOtp}
          className="w-full max-w-xs flex flex-col gap-3"
        >
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07xxxxxxxxx"
            className="bg-surface border border-border rounded-lg p-3 text-center"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-accent text-white rounded-lg p-3 font-semibold disabled:opacity-60"
          >
            {loading ? "جاري الإرسال..." : "أرسل كود التحقق"}
          </button>
          <button
            type="button"
            onClick={() => setMode("choose")}
            className="text-sm opacity-60"
          >
            رجوع
          </button>
        </form>
      )}

      {mode === "phone-verify" && (
        <form
          onSubmit={handleVerifyOtp}
          className="w-full max-w-xs flex flex-col gap-3"
        >
          <p className="text-xs text-center opacity-60">
            انتظر رسالة فيها كود التحقق على {phone}
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="كود التحقق"
            className="bg-surface border border-border rounded-lg p-3 text-center"
            dir="ltr"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-accent text-white rounded-lg p-3 font-semibold disabled:opacity-60"
          >
            <ShieldCheck className="w-4 h-4" />
            {loading ? "جاري التحقق..." : "تأكيد الكود"}
          </button>
          <button
            type="button"
            onClick={() => setMode("phone-enter")}
            className="text-sm opacity-60"
          >
            غيّر الرقم
          </button>
        </form>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
