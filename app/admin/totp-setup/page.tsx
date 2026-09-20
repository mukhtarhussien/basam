"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { startTotpSetup, confirmTotp } from "./actions";

export default function TotpSetupPage() {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    startTotpSetup()
      .then((result) => {
        if ("error" in result) {
          // مفعّل أصلاً - ما في شي نسويه هنا، نودّيه للوحة
          router.replace("/admin");
          return;
        }
        setSecret(result.secret);
        setQrDataUrl(result.qrDataUrl);
      })
      .catch(() => {
        setLoadError("لازم تسجل دخول بالباسوورد أول قبل هذي الصفحة");
      });
  }, [router]);

  const handleConfirm = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      const result = await confirmTotp(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/admin");
      router.refresh();
    });
  };

  if (loadError) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 gap-4 text-center">
        <p className="text-red-500">{loadError}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4 gap-6">
      <div className="w-16 h-16 rounded-full bg-accent/15 text-accent flex items-center justify-center">
        <ShieldCheck className="w-7 h-7" />
      </div>

      <div className="text-center max-w-sm">
        <h1 className="text-xl font-bold">إعداد Google Authenticator</h1>
        <p className="text-sm opacity-60 mt-1">
          هذا التفعيل يصير مرة وحدة بس. افتح تطبيق Authenticator وصوّر
          الكود تحت، أو أضف السر يدوياً
        </p>
      </div>

      {qrDataUrl ? (
        <div className="bg-white p-3 rounded-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR كود TOTP" className="w-48 h-48" />
        </div>
      ) : (
        <div className="w-48 h-48 bg-surface border border-border rounded-xl animate-pulse" />
      )}

      {secret && (
        <div className="text-center">
          <p className="text-xs opacity-50 mb-1">أو أضف يدوياً:</p>
          <p
            dir="ltr"
            className="font-mono text-sm bg-surface border border-border rounded-lg px-3 py-2 tracking-wider"
          >
            {secret}
          </p>
        </div>
      )}

      <form
        action={handleConfirm}
        className="w-full max-w-xs flex flex-col gap-3"
      >
        <input
          name="code"
          type="text"
          inputMode="numeric"
          placeholder="عبّي الكود من التطبيق للتأكيد"
          maxLength={6}
          required
          className="bg-surface border border-border rounded-lg p-3 outline-none focus:border-accent text-center text-lg tracking-[0.3em]"
        />

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !secret}
          className="bg-accent text-white rounded-lg p-3 font-semibold disabled:opacity-60"
        >
          {isPending ? "جاري التأكيد..." : "تأكيد وتفعيل"}
        </button>
      </form>
    </main>
  );
}
